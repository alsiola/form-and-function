import * as React from "react";
import { EventHandler, SyntheticEvent } from "react";
import { FormState } from "./Form";
import { StateEngine } from "./stateEngine";
import { FieldResult, isInvalidResult } from "./validators";
import { FieldValue } from "./Form";

/**
 * These props are provided to the component provided as renderer
 * to the Field component.  T is the type of the render components
 * own props, that will be provided via Fields renderProps prop
 */
export interface InjectedFieldProps<T extends object | void> {
    meta: {
        valid: boolean;
        error?: string;
        pristine: boolean;
        touched: boolean;
        active: boolean;
        isValidating: boolean;
    };
    input: {
        onChange: EventHandler<SyntheticEvent<HTMLInputElement>>;
        onFocus: EventHandler<SyntheticEvent<HTMLInputElement>>;
        onBlur: EventHandler<SyntheticEvent<HTMLInputElement>>;
        value: FieldValue | undefined;
    };
    ownProps: T;
}

/**
 * Field meta values provided by form-and-function
 */
export interface FieldMeta {
    touched: boolean;
    active: boolean;
    validation: FieldResult;
    isValidating: boolean;
}

/**
 * Props passed to the injected Field component when it is used
 */
export interface FieldProps<T extends object | void = void> {
    name: string;
    renderProps?: T;
    render: React.SFC<InjectedFieldProps<T>>;
    onChange?: EventHandler<SyntheticEvent<HTMLInputElement>>;
    onFocus?: EventHandler<SyntheticEvent<HTMLInputElement>>;
    onBlur?: EventHandler<SyntheticEvent<HTMLInputElement>>;
}

export interface FieldRecordAny<T = FieldMeta | Partial<FieldMeta>> {
    value: FieldValue | undefined;
    meta: T;
}

export type FieldRecord = FieldRecordAny<FieldMeta>;
export type FieldRecordUpdate = FieldRecordAny<Partial<FieldMeta>>;

/**
 * This is provided by the Form component when it calls makeField to
 * allow the Field to retrieve state from Form, and to indicate when
 * its value has changed
 */
interface FormActions {
    onChange: () => void;
    validate: (name: string, x: FieldValue | undefined) => Promise<FieldResult>;
    getInitialValue: (name: string) => FieldValue | undefined;
}

/**
 * formActions allow the field to trigger functions within the parent
 * stateEngine allows the field to update and retrieve values from its parents state
 */
export const makeField = (
    formActions: FormActions,
    stateEngine: StateEngine<FormState>
) =>
    class Field<T extends object> extends React.Component<FieldProps<T>, void> {
        static defaultProps: Partial<FieldProps<any>> = {
            renderProps: {}
        };

        /**
         * When Field is instantiated we need to set up its state
         * record in the parent Form
         */
        constructor(props: FieldProps<T>) {
            super(props);
            const initialValue = formActions.getInitialValue(props.name);

            // Setup initial state with validation as true
            this.updateState({
                meta: {
                    touched: false,
                    active: false,
                    validation: {
                        valid: true
                    },
                    isValidating: false
                },
                value: initialValue
            });

            // Run validation on initialValue and update
            formActions
                .validate(props.name, formActions.getInitialValue(props.name))
                .then(validation => {
                    this.updateState({
                        meta: {
                            validation
                        }
                    });
                });
        }

        /**
         * Take a partial update to the fields state (stored in Form) and
         * convert it into an update that can be applied to the Form state
         * without losing other field's state
         */
        updateState = (
            fieldState: Partial<FieldRecordUpdate>
        ): Promise<void> => {
            const { name } = this.props;
            return stateEngine.set(state => ({
                fields: {
                    ...state.fields,
                    [name]: {
                        meta: {
                            touched:
                                fieldState.meta && "touched" in fieldState.meta
                                    ? (fieldState.meta.touched as boolean)
                                    : state.fields[name].meta.touched,
                            active:
                                fieldState.meta && "active" in fieldState.meta
                                    ? (fieldState.meta.active as boolean)
                                    : state.fields[name].meta.active,
                            validation:
                                fieldState.meta && fieldState.meta.validation
                                    ? fieldState.meta.validation
                                    : state.fields[name].meta.validation,
                            isValidating:
                                fieldState.meta &&
                                "isValidating" in fieldState.meta
                                    ? (fieldState.meta.isValidating as boolean)
                                    : state.fields[name].meta.isValidating
                        },
                        value:
                            "value" in fieldState
                                ? fieldState.value
                                : state.fields[name].value
                    }
                }
            }));
        };

        handleFocus = () =>
            this.updateState({
                meta: {
                    touched: true,
                    active: true
                }
            });

        handleBlur = () =>
            this.updateState({
                meta: {
                    active: false
                }
            });

        /**
         * When the field changes we need to update the value in the parent Form
         * and rerun validation. As validation can be async then Promise.all
         * ensures that we immediately update the value even if validtion takes
         * some time. Returned promise is not currently used.
         */
        handleChange = (e: SyntheticEvent<any>) => {
            // Pulled into a variable so we don't lose this when the event is disposed
            const { value } = e.currentTarget;
            const { onChange, onBlur, onFocus } = this.props;

            onChange && onChange(e);
            onBlur && onBlur(e);
            onFocus && onFocus(e);

            return Promise.all([
                this.updateState({
                    value
                }).then(formActions.onChange),
                this.updateState({
                    meta: {
                        isValidating: true
                    }
                }).then(() =>
                    formActions
                        .validate(this.props.name, value)
                        .then(validation =>
                            this.updateState({
                                meta: {
                                    validation,
                                    isValidating: false
                                }
                            })
                        )
                )
            ]);
        };

        render() {
            const { name, render, renderProps } = this.props;

            const state = stateEngine.select(s => s.fields[name]);

            /**
             * If field does not have an initialValue, then it won't have a record
             * added to form state until the constructor async setters have run, so
             * we return null until the Form's record for this field is available
             */
            if (!state) {
                return null;
            }

            const {
                value,
                meta: { touched, active, validation, isValidating }
            } = state;

            const error = isInvalidResult(validation)
                ? validation.error
                : undefined;

            const valid = validation.valid;

            const pristine = value === formActions.getInitialValue(name);

            return render({
                ownProps: renderProps as T,
                input: {
                    onChange: this.handleChange,
                    onFocus: this.handleFocus,
                    onBlur: this.handleBlur,
                    value
                },
                meta: {
                    valid,
                    error,
                    pristine,
                    touched,
                    active,
                    isValidating
                }
            });
        }
    };
