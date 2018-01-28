import * as React from "react";
import { InjectedFormProps, InjectedFieldProps } from "../lib";
import { Form, Button, Message, Header } from "semantic-ui-react";
import { PrettyField, PrettyFieldProps } from "./PrettyField";
import { ReversingFieldProps, ReversingField } from "./ReversingField";

export interface PrettyField {
    name: string;
    label: string;
    hint: string;
    key?: string;
    reverse?: boolean;
}

export interface PrettyFormProps {
    fields: PrettyField[];
    title: string;
    submitLabel?: string;
    resetLabel?: string;
}

export const PrettyForm: React.SFC<
    InjectedFormProps<PrettyFormProps, PrettyFieldProps | ReversingFieldProps>
> = ({
    form,
    meta: { valid, errors, submitted },
    actions: { reset },
    ownProps: { fields, title, submitLabel = "Submit", resetLabel = "Reset" },
    Field
}) => (
    <Form {...form} size="huge" error={true}>
        <Header as="h2">{title}</Header>
        {fields.map(({ name, label, hint, key, reverse }) => (
            <Field
                key={key || name}
                name={name}
                render={reverse ? ReversingField : PrettyField}
                renderProps={{
                    label,
                    submitted,
                    hint,
                    reverse
                }}
            />
        ))}
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" onClick={reset}>
            {resetLabel}
        </Button>
        <Message error={true} hidden={!submitted || valid}>
            <Message.Header>You done made a boo boo.</Message.Header>
            <Message.List>
                {Object.entries(errors).map(([key, { error }]) => (
                    <Message.Item key={key}>
                        {
                            (
                                fields.find(f => f.name === key) || {
                                    name: "Form"
                                }
                            ).name
                        }: {error}
                    </Message.Item>
                ))}
            </Message.List>
        </Message>
    </Form>
);
