import * as React from "react";
import { SyntheticEvent } from "react";

import { componentStateEngine, StateEngine } from "./stateEngine";
import { FieldProps, FieldRecord, makeField } from "./Field";
import {
    validFn,
    FieldResult,
    isInvalidResult,
    ValidatorFn,
    ValidationErrors,
    isCovalidateResult,
    invalidFn,
    CovalidatedFieldResult
} from "./validators";

export type FieldValue = string | boolean | number;

export type FieldValueMap = Record<string, FieldValue>;
export type FieldMap = Record<string, FieldRecord>;

export type EventHandler = (values: FieldMap) => void;
export type MaybeEventHandler = EventHandler | undefined;

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
        errors: ValidationErrors;
        isValidating: boolean;
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
export interface FormProps<T extends object | void, U extends object | void> {
    name: string;
    render: React.SFC<InjectedFormProps<T, U>>;
    validators?: Record<string, ValidatorFn<FieldValue>>;
    initialValues?: FieldValueMap;
    onSubmit?: EventHandler;
    onSubmitFailed?: EventHandler;
    onChange?: EventHandler;
    renderProps?: T;
    stateEngine?: StateEngine<FormState>;
}

export interface FormState {
    fields: FieldMap;
    submitted: boolean;
    meta: {
        validation: FieldResult;
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
                // fields: Object.entries(props.initialValues).reduce(
                //     (out, [field, value]) => ({
                //         ...out,
                //         [field]: {
                //             value,
                //             meta: {
                //                 validation: this.validate(field, value)
                //             }
                //         }
                //     })
                // ) as any,
                fields: {},
                submitted: false,
                meta: {
                    validation: {
                        valid: true
                    }
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
                await this.stateEngine.set({
                    meta: {
                        validation: formResult
                    }
                });
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

        (this.props.onChange as EventHandler)(
            this.stateEngine.select(s => s.fields)
        );
    };

    /**
     * On submit call either props.onSubmit or props.onFailedSubmit
     * depending on current validation status
     */
    private handleSubmit = (
        onSubmit: MaybeEventHandler,
        onFailedSubmit: MaybeEventHandler,
        valid: boolean,
        fields: FieldMap
    ) => (e?: SyntheticEvent<any>) => {
        e && e.preventDefault();
        this.stateEngine.set({ submitted: true });
        valid
            ? (onSubmit as EventHandler)(fields)
            : (onFailedSubmit as EventHandler)(fields);
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
            meta: { validation }
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
                  isInvalidResult(validation)
                      ? { form: validation }
                      : ({} as ValidationErrors)
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
                isValidating
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
