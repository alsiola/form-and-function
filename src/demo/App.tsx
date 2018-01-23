import * as React from "react";
import { Segment, Button, ButtonGroup, Divider } from "semantic-ui-react";
import {
    IntlProvider,
    injectIntl,
    InjectedIntlProps,
    FormattedMessage,
    addLocaleData
} from "react-intl";
import * as en from "react-intl/locale-data/en";
import * as fr from "react-intl/locale-data/fr";

import { messages } from "./messages";
import { translations } from "./translations";
import { PrettyForm } from "./PrettyForm";

import { Form, validation, Formatter } from "../lib";

addLocaleData([...en, ...fr]);

const fields = [
    {
        name: "field1",
        label: "Field 1",
        hint: "The first field"
    },
    {
        name: "field2",
        label: "Field 2",
        hint: "The second field"
    }
];

const validators = validation.create({
    field1: validation.all(
        [
            validation.atLeastXChars(
                { chars: 3 },
                {
                    short: () => `at least 3 characters long`,
                    undef: () => "provided"
                }
            ),
            validation.atMostXChars(
                { chars: 7 },
                {
                    long: () => `at most 7 characters long`
                }
            ),
            validation.numeric({
                nonNumeric: () => `numeric only`
            })
        ],
        errors => `Entry must be ${errors.join(" and ")}.`
    ),
    field2: reporters => (val: string) =>
        new Promise(r =>
            setTimeout(
                () =>
                    r(
                        validation.atLeastXChars({ chars: 5 })(reporters, ((
                            x: string
                        ) => x) as any)(val)
                    ),
                1000
            )
        )
});

const translatedValidators = (
    formatter: Formatter<FormattedMessage.MessageDescriptor>
) =>
    validation.create(
        {
            field1: validation.all(
                [
                    validation.atLeastXChars(
                        { chars: 7 },
                        {
                            short: () => messages.short,
                            undef: () => messages.undef
                        }
                    ),
                    validation.atMostXChars(
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

const initialValues = {
    field1: "123"
};

export interface FormDemoOwnProps {
    changeLocale: (locale: string) => () => void;
}

class FormDemo extends React.Component<FormDemoOwnProps & InjectedIntlProps> {
    handleSubmit = (values: object) => console.log("submitted", values);

    handleFailedSubmit = (values: object) =>
        console.log("failed submit", values);

    render() {
        const { intl: { formatMessage }, changeLocale } = this.props;
        return (
            <div>
                <Segment padded="very">
                    <Form
                        name="simple form"
                        validators={validators}
                        initialValues={initialValues}
                        onSubmit={this.handleSubmit}
                        onSubmitFailed={this.handleFailedSubmit}
                        render={PrettyForm}
                        renderProps={{
                            fields,
                            title: "A Form!"
                        }}
                    />
                </Segment>

                <Segment padded="very">
                    <ButtonGroup>
                        <Button onClick={changeLocale("en")}>Go English</Button>
                        <Button onClick={changeLocale("fr")}>Go French</Button>
                    </ButtonGroup>
                    <Divider />
                    <Form
                        name="translated error form"
                        validators={translatedValidators(formatMessage)}
                        initialValues={initialValues}
                        onSubmit={this.handleSubmit}
                        onSubmitFailed={this.handleFailedSubmit}
                        render={PrettyForm}
                        renderProps={{
                            fields,
                            title: "Translated Form!"
                        }}
                    />
                </Segment>
            </div>
        );
    }
}

const FormDemoWithIntl = injectIntl(FormDemo) as React.ComponentClass<
    FormDemoOwnProps
>;

class App extends React.Component<{}, { locale: string }> {
    state = {
        locale: "en"
    };

    changeLocale = (locale: string) => () => this.setState({ locale });

    render() {
        return (
            <IntlProvider
                locale={this.state.locale}
                messages={translations[this.state.locale]}
            >
                <FormDemoWithIntl changeLocale={this.changeLocale} />
            </IntlProvider>
        );
    }
}

export default App;
