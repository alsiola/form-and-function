import * as React from "react";
import { InjectedFormProps } from "../lib";
import { Form, Button, Message, Header } from "semantic-ui-react";
import { PrettyField, PrettyFieldProps } from "./PrettyField";

export interface PrettyField {
    name: string;
    label: string;
    hint: string;
}

export interface PrettyFormProps {
    fields: PrettyField[];
    title: string;
}

export const PrettyForm: React.SFC<
    InjectedFormProps<PrettyFormProps, PrettyFieldProps>
> = ({
    input,
    meta: { valid, errors, submitted },
    actions: { reset },
    ownProps: { fields, title },
    Field
}) => (
    <Form {...input} size="huge" error={true}>
        <Header as="h2">{title}</Header>
        {fields.map(({ name, label, hint }) => (
            <Field
                key={name}
                name={name}
                render={PrettyField}
                renderProps={{
                    label,
                    submitted,
                    hint
                }}
            />
        ))}
        <Button type="submit">Submit</Button>
        <Button type="button" onClick={reset}>
            Reset
        </Button>
        <Message error={true} hidden={!submitted || valid}>
            <Message.Header>You done made a boo boo.</Message.Header>
            <Message.List>
                {Object.entries(errors).map(([key, value]) =>
                    fields
                        .filter(f => f.name === key)
                        .map(({ label, name }) => (
                            <Message.Item key={name}>
                                {label}: {value.error}
                            </Message.Item>
                        ))
                )}
            </Message.List>
        </Message>
    </Form>
);
