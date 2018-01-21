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
    meta: { valid, pristine, touched, active, error },
    ownProps: { submitted, label, hint }
}) => (
    <Form.Field>
        <Input
            {...input}
            focus={active}
            error={!valid}
            icon={
                !valid &&
                (touched || active || submitted) && <Icon name="alarm" />
            }
            label={label}
        />
        <Label pointing={true}>
            {!valid && active && error ? error : hint}
        </Label>
    </Form.Field>
);
