import * as React from "react";
import { EventHandler, SyntheticEvent } from "react";
import { FormState } from "./Form";
import { StateEngine } from "./stateEngine";
import { ValidationFieldResult } from "./validators";
import { FieldValue } from "./index";

export interface InjectedFieldProps<T extends object | void> {
    meta: {
        valid: boolean;
        error: string;
        pristine: boolean;
        touched: boolean;
        active: boolean;
    };
    input: {
        onChange: EventHandler<SyntheticEvent<HTMLInputElement>>;
        onFocus: EventHandler<SyntheticEvent<HTMLInputElement>>;
        onBlur: EventHandler<SyntheticEvent<HTMLInputElement>>;
        value: FieldValue | undefined;
    };
    ownProps: T;
}

export interface FieldMeta {
    touched: boolean;
    active: boolean;
    validation: ValidationFieldResult;
}

export interface FormActions {
    onChange: () => void;
    validate: (
        name: string,
        x: FieldValue | undefined
    ) => Promise<ValidationFieldResult>;
    getInitialValue: (name: string) => FieldValue | undefined;
}

export interface FieldProps<T extends object | void = void> {
    name: string;
    renderProps?: T;
    render: React.SFC<InjectedFieldProps<T>>;
}

export interface FieldRecordAny<T = FieldMeta | Partial<FieldMeta>> {
    value: FieldValue | undefined;
    meta: T;
}

export type FieldRecord = FieldRecordAny<FieldMeta>;
export type FieldRecordUpdate = FieldRecordAny<Partial<FieldMeta>>;

export const makeField = (
    formActions: FormActions,
    stateEngine: StateEngine<FormState>
): React.SFC<FieldProps> =>
    class Field<T extends object> extends React.Component<
        FieldProps<T>,
        FieldMeta
    > {
        constructor(props: FieldProps<T>) {
            super(props);
            const initialValue = formActions.getInitialValue(props.name);

            formActions
                .validate(props.name, formActions.getInitialValue(props.name))
                .then(validation => {
                    stateEngine.set(state => ({
                        fields: {
                            ...state.fields,
                            [props.name]: {
                                meta: {
                                    touched: false,
                                    active: false,
                                    validation
                                },
                                value: initialValue
                            }
                        }
                    }));
                });
        }

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
                                    : state.fields[name].meta.validation
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

        handleChange = (e: SyntheticEvent<any>) => {
            const newValue = e.currentTarget.value;
            Promise.all([
                this.updateState({
                    value: newValue
                }).then(formActions.onChange),
                formActions
                    .validate(this.props.name, newValue)
                    .then(validation =>
                        this.updateState({
                            meta: {
                                validation
                            }
                        })
                    )
            ]);
        };

        render() {
            const fieldState = stateEngine.select(
                s => s.fields[this.props.name]
            );

            if (!fieldState) {
                return null;
            }

            const { name, render, renderProps } = this.props;

            const { value, meta: { touched, active, validation } } = fieldState;

            const isValid = validation ? validation.valid : true;
            const isError = validation ? validation.error : "";

            const pristine = value === formActions.getInitialValue(name);

            return render({
                ownProps: renderProps || ({} as T),
                input: {
                    onChange: this.handleChange,
                    onFocus: this.handleFocus,
                    onBlur: this.handleBlur,
                    value
                },
                meta: {
                    valid: isValid,
                    error: isError,
                    pristine,
                    touched,
                    active
                }
            });
        }
    } as any;
