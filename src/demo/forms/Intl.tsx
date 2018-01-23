import * as React from "react";
import { Button, ButtonGroup, Divider } from "semantic-ui-react";
import { FormattedMessage, InjectedIntlProps, injectIntl } from "react-intl";
import { Form, validation, Formatter } from "../../lib";

import { PrettyForm } from "../PrettyForm";
import { messages } from "./messages";

const initialValues = {
    field1: "123"
};

const fields = (formatter: any) => [
    {
        name: "field1",
        label: formatter(messages.field1)
    },
    {
        name: "field2",
        label: formatter(messages.field2)
    }
];

const makeValidators = (
    formatter: Formatter<FormattedMessage.MessageDescriptor>
) =>
    validation.create(
        {
            field1: validation.all(
                [
                    validation.atLeast(
                        { chars: 7 },
                        {
                            short: () => messages.short,
                            undef: () => messages.undef
                        }
                    ),
                    validation.atMost(
                        { chars: 2 },
                        {
                            long: () => messages.long
                        }
                    )
                ],
                errors =>
                    formatter(messages.start) +
                    errors.join(formatter(messages.combine))
            )
        },
        formatter
    );

export interface BasicFormNoIntlProps {
    changeLocale: (locale: string) => () => void;
}

const IntlFormUnwrapped: React.SFC<
    BasicFormNoIntlProps & InjectedIntlProps
> = ({ intl: { formatMessage }, changeLocale }) => (
    <div>
        <ButtonGroup>
            <Button onClick={changeLocale("en")}>Go English</Button>
            <Button onClick={changeLocale("fr")}>Go French</Button>
        </ButtonGroup>
        <Divider />
        <Form
            name="intl-form"
            validators={makeValidators(formatMessage)}
            initialValues={initialValues}
            onSubmit={values => {
                console.log("Submitted with values", values);
            }}
            onSubmitFailed={values => {
                console.log("Submission failed with values", values);
            }}
            render={PrettyForm}
            renderProps={{
                fields: fields(formatMessage),
                title: formatMessage(messages.title),
                submitLabel: formatMessage(messages.submit),
                resetLabel: formatMessage(messages.reset)
            }}
        />
    </div>
);

export const IntlForm = injectIntl(IntlFormUnwrapped) as React.ComponentClass<
    BasicFormNoIntlProps
>;
