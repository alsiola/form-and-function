import * as React from "react";
import { Form, validation } from "../../lib";

import { PrettyForm } from "../PrettyForm";

const initialValues = {
    field1: "123"
};

const fields = [
    {
        name: "field1",
        label: "Field 1"
    },
    {
        name: "field2",
        label: "Field 2"
    },
    {
        name: "password",
        label: "Password"
    },
    {
        name: "passwordConfirm",
        label: "Confirm Password"
    }
];

const validators = validation.create({
    field1: validation.all(
        [
            validation.atLeast(
                { chars: 3 },
                {
                    short: "at least 3 characters long",
                    undef: "provided"
                }
            ),
            validation.atMost(
                { chars: 7 },
                {
                    long: ({ chars }) => `at most ${chars} characters long`
                }
            ),
            validation.numeric({
                nonNumeric: `numeric only`
            })
        ],
        errors => `Entry must be ${errors.join(" and ")}.`
    ),
    field2: validation.atLeast({ chars: 5 }),
    password: validation.covalidate(
        { fields: ["passwordConfirm"] },
        validation.atLeast({ chars: 5 })
    ),
    passwordConfirm: validation.matches({ fields: ["password"] })
});

export const ValidatedForm = () => (
    <Form
        name="validated-form"
        validators={validators}
        initialValues={initialValues}
        onSubmit={values => {
            console.log("Submitted with values", values);
        }}
        onSubmitFailed={values => {
            console.log("Submission failed with values", values);
        }}
        render={PrettyForm}
        renderProps={{
            fields,
            title: "Validated Form"
        }}
    />
);
