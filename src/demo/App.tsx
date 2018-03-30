import * as React from "react";
import { Segment } from "semantic-ui-react";
import { IntlProvider, addLocaleData } from "react-intl";
import * as en from "react-intl/locale-data/en";
import * as fr from "react-intl/locale-data/fr";
import { translations } from "./translations";

import { BasicForm } from "./forms/Basic";
import { ValidatedForm } from "./forms/Validated";
import { AsyncForm } from "./forms/Async";
import { IntlForm } from "./forms/Intl";
import { RadioForm } from "./forms/RadioButtons";
import { LinkedInputForm } from "./forms/LinkedInput";
import { FieldArrayForm } from "./forms/FieldArrayForm";

addLocaleData([...en, ...fr]);

export class App extends React.Component<{}, { locale: string }> {
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
                <div>
                    <Segment padded="very">
                        <FieldArrayForm />
                    </Segment>

                    <Segment padded="very">
                        <BasicForm />
                    </Segment>

                    <Segment padded="very">
                        <RadioForm />
                    </Segment>

                    <Segment padded="very">
                        <ValidatedForm />
                    </Segment>

                    <Segment padded="very">
                        <AsyncForm />
                    </Segment>

                    <Segment padded="very">
                        <IntlForm changeLocale={this.changeLocale} />
                    </Segment>

                    <Segment padded="very">
                        <LinkedInputForm />
                    </Segment>
                </div>
            </IntlProvider>
        );
    }
}
