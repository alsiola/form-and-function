import * as React from "react";
import { SyntheticEvent } from "react";

import { componentStateEngine, StateEngine } from "./stateEngine";
import { FieldProps, FieldRecord, makeField } from "./Field";
import {
    validFn,
    FieldResult,
    isInvalidResult,
    Validator,
    isCovalidateResult,
    CovalidatedFieldResult,
    InvalidFieldResult
} from "./validation/index";
import { FieldArrayProps, makeFieldArray } from "./FieldArray";

export type FieldValue = string | number | string[] | number[];

export type FieldValueMap = Record<string, FieldValue>;
export type FieldMap = Record<string, FieldRecord>;
export type FieldArrayMap = Record<string, FieldRecord[]>;
export type FormMap = Record<string, FieldRecord | FieldRecord[]>;

export type FormEventHandler = (values: FormMap) => void | Promise<void>;
export type MaybeFormEventHandler = FormEventHandler | undefined;

export interface FieldArrayInfo {
    isFieldArray: true;
    fieldIndex: number;
}
export interface FieldInfo {
    isFieldArray: false;
}

export type FieldChangeInfo = FieldArrayInfo | FieldInfo;

/**
 * Props supplied to the render component passed to Form
 * TOwnProps is the type of the Form render components own props
 * TFieldOwnProps is the type of the Field render components own props
 */
export interface InjectedFormProps<
    TOwnProps extends object | void = void,
    TFieldOwnProps extends object | void = void
> {
    Field: React.StatelessComponent<FieldProps<TFieldOwnProps>>;
    FieldArray: React.StatelessComponent<FieldArrayProps<TFieldOwnProps>>;
    form: React.DetailedHTMLProps<
        React.FormHTMLAttributes<HTMLFormElement>,
        HTMLFormElement
    >;
    values: FormMap;
    meta: {
        valid: boolean;
        submitted: boolean;
        errors: Record<string, InvalidFieldResult>;
        isValidating: boolean;
        isSubmitting: boolean;
    };
    actions: {
        reset: () => void;
        submit: () => void;
    };
    ownProps: TOwnProps;
}

/**
 * Props that can be passed to Form
 */
export interface FormProps<
    T extends object | void = {},
    U extends object | void = {}
> {
    name: string;
    render: React.SFC<InjectedFormProps<T, U>>;
    validators?: Record<
        string,
        Validator<FieldValue> | Validator<FieldValue[]>
    >;
    initialValues?: Record<string, FieldValue | FieldValue[]>;
    onSubmit?: FormEventHandler;
    onSubmitFailed?: FormEventHandler;
    onChange?: FormEventHandler;
    renderProps?: T;
    stateEngine?: StateEngine<FormState>;
}

export interface FormState<
    T extends FieldMap | FieldArrayMap = FieldMap | FieldArrayMap
> {
    fields: T;
    submitted: boolean;
    meta: {
        validation: FieldResult;
        isSubmitting: boolean;
    };
}

/**
 * This is provided by the Form component when it calls makeField to
 * allow the Field to retrieve state from Form, and to indicate when
 * its value has changed
 */
export interface FormActions<T extends FieldValue | FieldValue[]> {
    onChange: (
        name: string,
        newValue: T | undefined,
        fieldChangeInfo: FieldChangeInfo
    ) => void;
    getInitialValue: (name: string) => T | undefined;
}

export class Form<
    T extends object | void,
    U extends object | void
> extends React.Component<FormProps<T, U>, FormState> {
    static defaultProps: Partial<FormProps<any, any>> = {
        initialValues: {},
        onSubmit: () => {},
        onSubmitFailed: () => {},
        onChange: () => {},
        renderProps: {}
    };

    private Field: React.StatelessComponent<FieldProps<U>>;
    private FieldArray: React.StatelessComponent<FieldArrayProps<U>>;
    private stateEngine: StateEngine<FormState>;

    /**
     * When a Form is instantiated, generate a state engine with initial empty
     * state - this will be filled in by Fields, and create the Field component
     * that will be injected.
     */
    constructor(props: FormProps<T, U>) {
        super(props);
        this.stateEngine =
            props.stateEngine ||
            componentStateEngine(this, {
                fields: {},
                submitted: false,
                meta: {
                    validation: {
                        valid: true
                    },
                    isSubmitting: false
                }
            });
        this.makeField();
        this.makeFieldArray();
    }

    componentWillReceiveProps(nextProps: FormProps<T, U>) {
        if (nextProps.validators !== this.props.validators) {
            this.makeField(false);
            this.makeFieldArray(false);
        }
        return true;
    }

    /**
     * Generates the Field that will be passed in InjectedFormProps
     */
    private makeField = (resetField = true) => {
        this.Field = makeField(
            {
                onChange: this.handleFieldChange,
                getInitialValue: this.getInitialValue as (
                    name: string
                ) => FieldValue
            },
            this.stateEngine as StateEngine<FormState<FieldMap>>,
            resetField
        ) as any;
    };

    /**
     * Generates the FieldArray that will be passed in InjectedFormProps
     */
    private makeFieldArray = (resetFieldArray = true) => {
        this.FieldArray = makeFieldArray(
            {
                onChange: this.handleFieldChange,
                getInitialValue: this.getInitialValue as (
                    name: string
                ) => FieldValue[]
            },
            this.stateEngine as StateEngine<FormState<FieldArrayMap>>,
            resetFieldArray
        ) as any;
    };

    /**
     * Reset everything to initial values
     * State will be fleshed out by Field children when they are recreated
     */
    private reset = () => {
        this.stateEngine
            .set({
                fields: {},
                submitted: false
            })
            .then(() => this.makeField())
            .then(() => this.forceUpdate());
    };

    /**
     * Allows Fields to get to their initial state
     */
    private getInitialValue = (name: string) =>
        (this.props.initialValues || {})[name] || "";

    /**
     * Is every field passing validation
     */
    private allValid = (validationResult: FormMap): boolean => {
        return (
            this.stateEngine.select(s => s.meta.validation.valid) &&
            Object.values(validationResult).every(
                r =>
                    Array.isArray(r)
                        ? r.every(
                              rf =>
                                  rf.meta.validation
                                      ? rf.meta.validation.valid
                                      : true
                          )
                        : r.meta.validation ? r.meta.validation.valid : true
            )
        );
    };

    /**
     * If there is a validator for field with name of {name}
     * then run it, otherwise return valid
     */
    private validate = async (
        name: string,
        value: FieldValue | FieldValue[] | undefined
    ): Promise<FieldResult | CovalidatedFieldResult> => {
        const fields = this.stateEngine.select(s => s.fields);

        if (Array.isArray(value)) {
            return Promise.resolve({
                valid: true
            }) as any;
        } else {
            if (this.props.validators && this.props.validators.form) {
                const formResult = await (this.props.validators.form as any)(
                    "",
                    fields
                );

                if (isCovalidateResult(formResult)) {
                    await Promise.all(
                        formResult.covalidate.map(async field => {
                            const fieldRecord = fields[field];

                            if (Array.isArray(fieldRecord)) {
                                await Promise.all(
                                    fieldRecord.map(fieldArrayRecord =>
                                        this.validate(
                                            field,
                                            fieldArrayRecord.value
                                        )
                                    )
                                );
                            } else {
                                await this.validate(field, fieldRecord.value);
                            }
                        })
                    );
                } else {
                    await this.stateEngine.set(({ meta }) => ({
                        meta: {
                            ...meta,
                            validation: formResult
                        }
                    }));
                }
            }

            if (!this.props.validators) {
                return validFn();
            }

            const validator = this.props.validators[name];

            if (!validator) {
                return validFn();
            }

            const result = await (validator as any)(
                value as FieldValue,
                fields
            );

            return result;
        }
    };

    /**
     * Called by Fields when their value changes
     * If a form onChange handler was passed as a prop, call it
     */
    private handleFieldChange = async (
        fieldName: string,
        value: FieldValue | FieldValue[] | undefined,
        fieldChangeInfo: FieldChangeInfo
    ) => {
        if (fieldChangeInfo.isFieldArray) {
            console.log("Field array changed");
        } else {
            console.log("Field changed");
            await (this.stateEngine as StateEngine<FormState<FieldMap>>).set(
                ({ fields }) => ({
                    fields: {
                        ...fields,
                        [fieldName]: {
                            ...fields[fieldName],
                            value: value as FieldValue,
                            meta: {
                                ...(fields[fieldName] || {}).meta,
                                isValidating: true
                            }
                        }
                    }
                })
            );

            this.validate(fieldName, value).then(validation => {
                if (isCovalidateResult(validation)) {
                    Promise.all(
                        validation.covalidate.map(async covalidatedField => ({
                            covalidatedField,
                            result: await this.validate(
                                covalidatedField,
                                this.stateEngine.select(
                                    s =>
                                        (s.fields[
                                            covalidatedField
                                        ] as FieldRecord).value
                                )
                            )
                        }))
                    ).then(covalidateResults => {
                        this.stateEngine.set(({ fields }) => ({
                            fields: {
                                ...fields,
                                ...covalidateResults.reduce(
                                    (out, { covalidatedField, result }) => ({
                                        ...out,
                                        [covalidatedField]: {
                                            ...fields[covalidatedField],
                                            meta: {
                                                ...((fields[covalidatedField] ||
                                                    {}) as FieldRecord).meta,
                                                validation: result,
                                                isValidating: false
                                            }
                                        }
                                    }),
                                    {}
                                ),
                                [fieldName]: {
                                    ...fields[fieldName],
                                    meta: {
                                        ...((fields[fieldName] ||
                                            {}) as FieldRecord).meta,
                                        validation: validation.result,
                                        isValidating: false
                                    }
                                }
                            }
                        }));
                    });
                } else {
                    (this.stateEngine as StateEngine<FormState<FieldMap>>).set(
                        ({ fields }) => ({
                            fields: {
                                ...fields,
                                [fieldName]: {
                                    ...fields[fieldName],
                                    meta: {
                                        ...(fields[fieldName] || {}).meta,
                                        validation,
                                        isValidating: false
                                    }
                                }
                            }
                        })
                    );
                }
            });
        }

        (this.props.onChange as FormEventHandler)(
            this.stateEngine.select(s => s.fields)
        );
    };

    /**
     * On submit call either props.onSubmit or props.onFailedSubmit
     * depending on current validation status
     */
    private handleSubmit = (
        onSubmit: MaybeFormEventHandler,
        onFailedSubmit: MaybeFormEventHandler,
        valid: boolean,
        fields: FormMap
    ) => (e?: SyntheticEvent<any>) => {
        e && e.preventDefault();
        this.stateEngine.set(({ meta }) => ({
            submitted: true,
            meta: { ...meta, isSubmitting: true }
        }));
        Promise.resolve(
            valid
                ? onSubmit && onSubmit(fields)
                : onFailedSubmit && onFailedSubmit(fields)
        ).then(() =>
            this.stateEngine.set(({ meta }) => ({
                meta: {
                    ...meta,
                    isSubmitting: false
                }
            }))
        );
    };

    render() {
        const {
            render,
            onSubmit,
            onSubmitFailed,
            name,
            renderProps
        } = this.props;

        const {
            submitted,
            fields,
            meta: { validation, isSubmitting }
        } = this.stateEngine.get();

        const valid = this.allValid(fields);

        /**
         * Filters out all keys from validationResult where valid is true,
         * if form is valid then we know this will be an empty object, so we can
         * just return that
         */
        const validationResult = valid
            ? {}
            : Object.entries(fields).reduce(
                  (out, [key, value]) =>
                      Object.assign(
                          {},
                          out,
                          isInvalidResult(value.meta.validation)
                              ? {
                                    [key]: value.meta.validation
                                }
                              : {}
                      ),
                  isInvalidResult(validation) ? { form: validation } : {}
              );

        const isValidating = Object.values(fields).some(
            field =>
                Array.isArray(field)
                    ? field.some(f => f.meta.isValidating)
                    : field.meta.isValidating
        );

        const submit = this.handleSubmit(
            onSubmit,
            onSubmitFailed,
            valid,
            fields
        );

        return render({
            ownProps: renderProps as T,
            meta: {
                valid,
                submitted,
                errors: validationResult,
                isValidating,
                isSubmitting
            },
            Field: this.Field,
            FieldArray: this.FieldArray,
            values: fields,
            actions: {
                reset: this.reset,
                submit
            },
            form: {
                name,
                onSubmit: submit
            }
        });
    }
}
