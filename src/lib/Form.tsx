import * as React from "react";
import { componentStateEngine, StateEngine } from "./stateEngine";
import { FieldProps, FieldRecord, makeField } from "./Field";
import { SyntheticEvent } from "react";
import {
    validFn,
    ValidatorFn,
    ValidationResult,
    ValidationFieldResult
} from "./validators";

export type FieldValue = string | boolean | number;

export type FieldValueMap = Record<string, FieldValue>;
export type FieldMap = Record<string, FieldRecord>;

export type EventHandler = (values: FieldMap) => void;
export type MaybeEventHandler = EventHandler | undefined;

export interface InjectedFormProps<
    TOwnProps extends object | void = void,
    TFieldOwnProps extends object | void = void
> {
    Field: React.SFC<FieldProps<TFieldOwnProps>>;
    input: React.DetailedHTMLProps<
        React.FormHTMLAttributes<HTMLFormElement>,
        HTMLFormElement
    >;
    values: FieldMap;
    meta: {
        valid: boolean;
        submitted: boolean;
        errors: ValidationResult;
    };
    actions: {
        reset: () => void;
        submit: () => void;
    };
    ownProps: TOwnProps;
}

export interface FormProps<T extends object | void, U extends object | void> {
    name: string;
    render: React.SFC<InjectedFormProps<T, U>>;
    validators?: Record<string, ValidatorFn<FieldValue>>;
    initialValues?: FieldValueMap;
    onSubmit?: EventHandler;
    onSubmitFailed?: EventHandler;
    onChange?: EventHandler;
    renderProps?: T;
}

export interface FormState {
    fields: FieldMap;
    submitted: boolean;
}

export class Form<
    T extends object | void,
    U extends object | void
> extends React.Component<FormProps<T, U>, FormState> {
    private Field: React.SFC<FieldProps<U>>;
    private stateEngine: StateEngine<FormState>;

    constructor(props: FormProps<T, U>) {
        super(props);
        const initialState = this.getInitialState(props.initialValues);
        this.stateEngine = componentStateEngine(this, initialState);
        this.makeField();
    }

    private getInitialState = (initialValues?: FieldValueMap): FormState => {
        const fields = initialValues
            ? Object.keys(initialValues).reduce(
                  (out, key) => ({
                      ...out,
                      [key]: {
                          value: initialValues[key],
                          meta: {
                              touched: false,
                              active: false,
                              validation: {
                                  valid: true,
                                  error: ""
                              }
                          }
                      }
                  }),
                  {} as FormState
              )
            : {};
        return {
            fields,
            submitted: false
        };
    };

    private makeField = () => {
        this.Field = makeField(
            {
                onChange: this.handleFieldChange,
                validate: this.validate,
                getInitialValue: this.getInitialValue
            },
            this.stateEngine
        ) as React.SFC<FieldProps<U>>;
    };

    private reset = () => {
        this.stateEngine
            .set(this.getInitialState(this.props.initialValues))
            .then(this.makeField)
            .then(() => this.forceUpdate());
    };

    private getInitialValue = (name: string) =>
        (this.props.initialValues || {})[name] || "";

    private allValid = (validationResult: FieldMap): boolean => {
        return Object.values(validationResult).every(
            r => r.meta.validation.valid
        );
    };

    private validate = async (
        name: string,
        value: FieldValue
    ): Promise<ValidationFieldResult> => {
        if (!this.props.validators) {
            return validFn();
        }

        return this.props.validators[name]
            ? this.props.validators[name](value)
            : validFn();
    };

    private handleFieldChange = () => {
        this.props.onChange &&
            this.props.onChange(this.stateEngine.select(s => s.fields));
    };

    private handleSubmit = (
        onSubmit: MaybeEventHandler,
        onFailedSubmit: MaybeEventHandler,
        valid: boolean,
        fields: FieldMap
    ) => (e?: SyntheticEvent<any>) => {
        e && e.preventDefault();
        this.stateEngine.set({ submitted: true });
        onSubmit && valid
            ? onSubmit(fields)
            : onFailedSubmit && onFailedSubmit(fields);
    };

    render() {
        const {
            render,
            onSubmit,
            onSubmitFailed,
            name,
            renderProps
        } = this.props;

        const { submitted, fields } = this.stateEngine.get();

        const validationResult = Object.entries(fields).reduce(
            (out, [key, value]) =>
                Object.assign(
                    {},
                    out,
                    value.meta.validation.error
                        ? {
                              [key]: value.meta.validation
                          }
                        : {}
                ),
            {} as ValidationResult
        );

        const valid = this.allValid(fields);

        const submit = this.handleSubmit(
            onSubmit,
            onSubmitFailed,
            valid,
            fields
        );

        return render({
            ownProps: renderProps || ({} as T),
            meta: {
                valid,
                submitted,
                errors: validationResult
            },
            Field: this.Field,
            values: fields,
            actions: {
                reset: this.reset,
                submit
            },
            input: {
                name,
                onSubmit: submit
            }
        });
    }
}
