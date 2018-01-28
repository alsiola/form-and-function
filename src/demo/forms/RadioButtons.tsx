import * as React from "react";
import { Form, InjectedFormProps, InjectedFieldProps } from "../../lib";
import { Form as SURForm, Header, Label, Divider } from "semantic-ui-react";

export interface PrettyField {
    name: string;
    label: string;
    hint: string;
}

export interface PrettyFormProps {
    fields: PrettyField[];
    title: string;
    submitLabel?: string;
    resetLabel?: string;
}

export const RadioButton: React.SFC<
    InjectedFieldProps<{ value: string; title: string }>
> = ({ input, ownProps: { value, title } }) => (
    <>
        <Label htmlFor={value} pointing="right">
            {title}
        </Label>
        <input {...input} id={value} value={value} type="radio" />
    </>
);

export const RenderRadioForm: React.SFC<
    InjectedFormProps<{ title: string }, { value: string; title: string }>
> = ({
    form,
    meta: { valid, errors, submitted },
    actions: { reset },
    ownProps: { title },
    Field
}) => (
    <SURForm {...form} size="huge" error={true}>
        <Header as="h2">{title}</Header>
        <Field
            name="radios"
            render={RadioButton}
            renderProps={{ value: "one", title: "One" }}
        />
        <Divider />
        <Field
            name="radios"
            render={RadioButton}
            renderProps={{ value: "two", title: "Two" }}
        />
        <Divider />
        <Field
            name="radios"
            render={RadioButton}
            renderProps={{ value: "three", title: "Three" }}
        />
    </SURForm>
);

export const RadioForm = () => (
    <Form
        name="radio-form"
        onChange={console.log}
        onSubmit={values => {
            console.log("Submitted with values", values);
        }}
        render={RenderRadioForm}
        renderProps={{
            title: "Radio Button Form"
        }}
    />
);
