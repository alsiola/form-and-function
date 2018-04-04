import * as React from "react";
import { Form, Input, Label, Icon } from "semantic-ui-react";
import { InjectedFieldProps } from "../lib";

export interface ReversingFieldProps {
    submitted: boolean;
    label: string;
    hint: string;
    reverse: boolean;
}

const reverseString = (v?: string) =>
    ((v as string) || "")
        .split("")
        .reverse()
        .join("");

export const ReversingField: React.SFC<
    InjectedFieldProps<ReversingFieldProps>
> = ({
    input,
    meta: { valid, pristine, touched, active, error, isValidating },
    ownProps: { submitted, label, hint, reverse }
}) => (
    <Form.Field>
        <Input
            {...input}
            value={reverse ? reverseString(input.value as string) : input.value}
            onChange={e =>
                input.onChange(e, {
                    value: reverse
                        ? reverseString(e.currentTarget.value)
                        : e.currentTarget.value
                })
            }
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
