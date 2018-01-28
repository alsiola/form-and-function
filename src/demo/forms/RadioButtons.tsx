import * as React from "react";
import { Form, InjectedFormProps, InjectedFieldProps } from "../../lib";
import { Form as SURForm, Header, Radio } from "semantic-ui-react";
import { PrettyRadio } from "../PrettytRadio";

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
            render={PrettyRadio}
            renderProps={{ value: "one", title: "One" }}
        />
        <Field
            name="radios"
            render={PrettyRadio}
            renderProps={{ value: "two", title: "Two" }}
        />
        <Field
            name="radios"
            render={PrettyRadio}
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
