import * as React from "react";
import {
    IntlProvider,
    injectIntl,
    InjectedIntlProps,
    Messages,
    FormattedMessage,
    addLocaleData
} from "react-intl";
import * as en from "react-intl/locale-data/en";
import * as fr from "react-intl/locale-data/fr";

import { PrettyForm } from "./PrettyForm";
import { Segment } from "semantic-ui-react";

addLocaleData([...en, ...fr]);

import { Form, validation, Formatter } from "../lib";

const messages: Messages = {
    start: {
        id: "formvalidation.start",
        defaultMessage: "Must be "
    },
    short: {
        id: "formvalidation.short",
        defaultMessage: "at least {chars} characters"
    },
    long: {
        id: "formvalidation.long",
        defaultMessage: "at most {chars} characters"
    },
    undef: {
        id: "formvalidation.undef",
        defaultMessage: "provided"
    },
    combine: {
        id: "formvalidation.combine",
        defaultMessage: " and "
    }
};

const translations: Record<string, Record<string, string>> = {
    fr: {
        "formvalidation.start": "Doit être ",
        "formvalidation.short": "au maximum de {chars} caractères",
        "formvalidation.long": "au minimum de {chars} caractères",
        "formvalidation.undef": "fourni",
        "formvalidation.combine": " et "
    }
};

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

class FormDemo extends React.Component<InjectedIntlProps> {
    handleSubmit = (values: object) => console.log("submitted", values);

    handleFailedSubmit = (values: object) =>
        console.log("failed submit", values);

    render() {
        const { formatMessage } = this.props.intl;
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

const FormDemoWithIntl = (injectIntl(FormDemo) as any) as React.SFC<{}>;

class App extends React.Component<{}, { locale: string }> {
    state = {
        locale: "en"
    };
    render() {
        return (
            <IntlProvider
                locale={this.state.locale}
                messages={translations[this.state.locale]}
            >
                <div>
                    <button onClick={() => this.setState({ locale: "en" })}>
                        Go English
                    </button>
                    <button onClick={() => this.setState({ locale: "fr" })}>
                        Go French
                    </button>
                    <FormDemoWithIntl />
                </div>
            </IntlProvider>
        );
    }
}

export default App;
