import * as React from "react";
import { Form, validation } from "../lib";
import { PrettyForm } from "./PrettyForm";
import { Segment } from "semantic-ui-react";

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
            validation.atLeastXChars(3, {
                short: () => `at least 3 characters long`,
                undef: () => "provided"
            }),
            validation.atMostXChars(7, {
                long: () => `at most 7 characters long`
            }),
            validation.numeric({
                nonNumeric: () => `numeric only`
            })
        ],
        errors => `Entry must be ${errors.join(" and ")}.`
    ),
    field2: validation.atLeastXChars(5)
});

const initialValues = {
    field1: "123"
};

class App extends React.Component {
    handleSubmit = (values: object) => console.log("submitted", values);

    handleFailedSubmit = (values: object) =>
        console.log("failed submit", values);

    render() {
        return (
            <Segment padded="very">
                <Form
                    name="test"
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
        );
    }
}

export default App;
