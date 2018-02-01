import * as React from "react";
import { InjectedFieldProps } from "../lib/index";
import { Form, Radio } from "semantic-ui-react";

export const PrettyRadio: React.SFC<
    InjectedFieldProps<{ value: string; title: string }>
> = ({ input, ownProps: { value, title } }) => (
    <Form.Field>
        <Radio
            label={title}
            value={value}
            checked={input.value === value}
            onChange={input.onChange}
        />
    </Form.Field>
);
