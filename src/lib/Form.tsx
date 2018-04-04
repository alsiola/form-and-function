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

export type FieldValue = string | number;

export type FieldValueMap = Record<string, FieldValue>;
export type FieldMap = Record<string, FieldRecord>;

export type FormEventHandler = (values: FieldMap) => void | Promise<void>;
export type MaybeFormEventHandler = FormEventHandler | undefined;

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
    form: React.DetailedHTMLProps<
        React.FormHTMLAttributes<HTMLFormElement>,
        HTMLFormElement
    >;
    values: FieldMap;
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
    validators?: Record<string, Validator<FieldValue>>;
    initialValues?: FieldValueMap;
    onSubmit?: FormEventHandler;
    onSubmitFailed?: FormEventHandler;
    onChange?: FormEventHandler;
    renderProps?: T;
    stateEngine?: StateEngine<FormState>;
}

export interface FormState {
    fields: FieldMap;
    submitted: boolean;
    meta: {
        validation: FieldResult;
        isSubmitting: boolean;
    };
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
    }

    componentWillReceiveProps(nextProps: FormProps<T, U>) {
        if (nextProps.validators !== this.props.validators) {
            this.makeField(false);
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
                getInitialValue: this.getInitialValue
            },
            this.stateEngine,
            resetField
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
        (this.props.initialValues as FieldValueMap)[name] || "";

    /**
     * Is every field passing validation
     */
    private allValid = (validationResult: FieldMap): boolean => {
        return (
            this.stateEngine.select(s => s.meta.validation.valid) &&
            Object.values(validationResult).every(
                r => (r.meta.validation ? r.meta.validation.valid : true)
            )
        );
    };

    /**
     * If there is a validator for field with name of {name}
     * then run it, otherwise return valid
     */
    private validate = async (
        name: string,
        value: FieldValue | undefined
    ): Promise<FieldResult | CovalidatedFieldResult> => {
        const fields = this.stateEngine.select(s => s.fields);

        if (this.props.validators && this.props.validators.form) {
            const formResult = await this.props.validators.form("", fields);

            if (isCovalidateResult(formResult)) {
                await formResult.covalidate.map(field =>
                    this.validate(field, fields[field].value)
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

        const result = await validator(value, fields);

        return result;
    };

    /**
     * Called by Fields when their value changes
     * If a form onChange handler was passed as a prop, call it
     */
    private handleFieldChange = async (
        fieldName: string,
        value: FieldValue | undefined
    ) => {
        await this.stateEngine.set(({ fields }) => ({
            fields: {
                ...fields,
                [fieldName]: {
                    ...fields[fieldName],
                    value,
                    meta: {
                        ...(fields[fieldName] || {}).meta,
                        isValidating: true
                    }
                }
            }
        }));

        this.validate(fieldName, value).then(validation => {
            if (isCovalidateResult(validation)) {
                Promise.all(
                    validation.covalidate.map(async covalidatedField => ({
                        covalidatedField,
                        result: await this.validate(
                            covalidatedField,
                            this.stateEngine.select(
                                s => s.fields[covalidatedField].value
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
                                            ...(fields[covalidatedField] || {})
                                                .meta,
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
                                    ...(fields[fieldName] || {}).meta,
                                    validation: validation.result,
                                    isValidating: false
                                }
                            }
                        }
                    }));
                });
            } else {
                this.stateEngine.set(({ fields }) => ({
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
                }));
            }
        });

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
        fields: FieldMap
    ) => (e?: SyntheticEvent<any>) => {
        e && e.preventDefault();
        this.stateEngine.set(({ meta }) => ({
            submitted: true,
            meta: { ...meta, isSubmitting: true }
        }));
        Promise.resolve(
            valid
                ? (onSubmit as FormEventHandler)(fields)
                : (onFailedSubmit as FormEventHandler)(fields)
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
            field => field.meta.isValidating
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
