import * as React from "react";
import { SyntheticEvent } from "react";
import {
    FieldEventHandler,
    InjectedFieldProps,
    FieldRecordUpdate,
    SetValue,
    FieldMeta,
    FieldRecordAny
} from "./Field";
import { StateEngine } from "./stateEngine";
import { FormActions, FormState, FieldArrayMap, FieldValue } from "./Form";
import { FieldResult, isInvalidResult } from "./validation/index";

export type FieldArrayRecord = Array<FieldRecordAny<FieldMeta>>;

export interface FieldArrayProps<T extends object | void = void> {
    name: string;
    renderProps?: T;
    render: React.SFC<InjectedFieldArrayProps<T>>;
    onChange?: FieldEventHandler;
    onFocus?: FieldEventHandler;
    onBlur?: FieldEventHandler;
}

export interface InjectedFieldArrayProps<T extends object | void = void> {
    fields: InjectedFieldProps[];
    addField: () => void;
    removeField: (fieldIndex: number) => () => void;
}

/**
 * formActions allow the field to trigger functions within the parent
 * stateEngine allows the field to update and retrieve values from its parents state
 */
export const makeFieldArray = (
    formActions: FormActions<FieldValue[]>,
    stateEngine: StateEngine<FormState<FieldArrayMap>>,
    resetState = true
) =>
    class FieldArray<T extends object> extends React.Component<
        FieldArrayProps<T>,
        void
    > {
        static defaultProps: Partial<FieldArrayProps<any>> = {
            renderProps: {}
        };

        /**
         * When Field is instantiated we need to set up its state
         * record in the parent Form
         */
        constructor(props: FieldArrayProps<T>) {
            super(props);

            if (!resetState) {
                return;
            }

            const initialValues = formActions.getInitialValue(props.name);

            if (!Array.isArray(initialValues)) {
                throw new Error(
                    `Initial state passed to FieldArray must be an array, received ${initialValues}`
                );
            }

            // Setup initial state with validation as true
            initialValues.forEach((initialValue: any, i: number) => {
                this.updateState(i, {
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
            });

            // Easy way to trigger validation of initialValue
            formActions.onChange(props.name, initialValues);
        }

        addField = (fieldIndex: number) => () => {
            this.updateState(fieldIndex, {
                meta: {
                    touched: false,
                    active: false,
                    validation: {
                        valid: true
                    },
                    isValidating: false
                },
                value: ""
            });
        };

        removeField = (fieldIndex: number) => () => {
            const { name } = this.props;
            return stateEngine.set(state => {
                const newFields = state.fields[name].slice();
                newFields.splice(fieldIndex, 1);

                return {
                    fields: {
                        ...state.fields,
                        [name]: newFields
                    }
                };
            });
        };

        /**
         * Take a partial update to the fields state (stored in Form) and
         * convert it into an update that can be applied to the Form state
         * without losing other field's state
         * This is to simplify the other updaters
         */
        updateState = (
            fieldIndex: number,
            fieldState: Partial<FieldRecordUpdate>
        ): Promise<void> => {
            const { name } = this.props;
            return stateEngine.set(state => {
                const updatedField = {
                    meta: {
                        touched:
                            fieldState.meta && "touched" in fieldState.meta
                                ? (fieldState.meta.touched as boolean)
                                : state.fields[name][fieldIndex].meta.touched,
                        active:
                            fieldState.meta && "active" in fieldState.meta
                                ? (fieldState.meta.active as boolean)
                                : state.fields[name][fieldIndex].meta.active,
                        validation:
                            fieldState.meta && fieldState.meta.validation
                                ? fieldState.meta.validation
                                : state.fields[name][fieldIndex].meta
                                      .validation,
                        isValidating:
                            fieldState.meta && "isValidating" in fieldState.meta
                                ? (fieldState.meta.isValidating as boolean)
                                : state.fields[name][fieldIndex].meta
                                      .isValidating
                    },
                    value:
                        "value" in fieldState
                            ? fieldState.value
                            : state.fields[name][fieldIndex].value
                };

                let newFields;

                if (Array.isArray(state.fields[name])) {
                    const oldState = state.fields[name].slice();
                    oldState.splice(fieldIndex, 1, updatedField);
                    newFields = oldState;
                } else {
                    newFields = [updatedField];
                }

                return {
                    fields: {
                        ...state.fields,
                        [name]: newFields
                    }
                };
            });
        };

        /**
         * Calls props.onFocus as we have not passed this to input
         */
        handleFocus = (fieldIndex: number) => (e: SyntheticEvent<any>) => {
            const { onFocus } = this.props;

            onFocus && onFocus(e);

            this.updateState(fieldIndex, {
                meta: {
                    touched: true,
                    active: true
                }
            });
        };

        handleBlur = (fieldIndex: number) => (e: SyntheticEvent<any>) => {
            const { onBlur } = this.props;

            onBlur && onBlur(e);

            this.updateState(fieldIndex, {
                meta: {
                    active: false
                }
            });
        };

        /**
         * When the field changes we need to update the value in the parent Form
         * and rerun validation. As validation can be async then Promise.all
         * ensures that we immediately update the value even if validtion takes
         * some time. Returned promise is not currently used.
         */
        handleChange = (fieldIndex: number) => (
            e: SyntheticEvent<any>,
            setValue?: SetValue
        ) => {
            // Pulled into a variable so we don't lose this when the event is disposed
            const { value } = e.currentTarget;
            const { onChange } = this.props;

            onChange && onChange(e, setValue);

            this.updateState(fieldIndex, { value });

            // formActions.onChange(
            //     this.props.name,
            //     (setValue && setValue.value) || value,
            //     { fieldIndex }
            // );
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

            return render({
                addField: this.addField(state.length),
                removeField: this.removeField,
                fields: state.map(
                    (
                        {
                            value,
                            meta: { touched, active, validation, isValidating }
                        },
                        fieldIndex
                    ) => {
                        const error = isInvalidResult(validation)
                            ? validation.error
                            : undefined;

                        const valid = validation.valid;

                        const pristine =
                            value === formActions.getInitialValue(name);
                        return {
                            ownProps: renderProps as T,
                            input: {
                                onChange: this.handleChange(fieldIndex),
                                onFocus: this.handleFocus(fieldIndex),
                                onBlur: this.handleBlur(fieldIndex),
                                value,
                                name
                            },
                            meta: {
                                valid,
                                error,
                                pristine,
                                touched,
                                active,
                                isValidating
                            }
                        };
                    }
                )
            });
        }
    };
