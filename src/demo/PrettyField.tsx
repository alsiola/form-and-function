import * as React from "react";
import { Form, Input, Label, Icon } from "semantic-ui-react";
import { InjectedFieldProps } from "../lib";

export interface PrettyFieldProps {
    submitted: boolean;
    label: string;
    hint: string;
}

export const PrettyField: React.SFC<InjectedFieldProps<PrettyFieldProps>> = ({
    input,
    meta: { valid, pristine, touched, active, error, isValidating },
    ownProps: { submitted, label, hint }
}) => (
    <Form.Field>
        <Input
            {...input}
            focus={active}
            error={!valid}
            icon={
                isValidating ? (
                    <Icon loading={true} name="sun" />
                ) : (
                    (touched || active || submitted) &&
                    (valid ? (
                        <Icon name="checkmark" />
                    ) : (
                        <Icon name="warning circle" />
                    ))
                )
            }
            label={label}
        />
        {!valid && active && error && <Label pointing={true}>{error}</Label>}
    </Form.Field>
);
