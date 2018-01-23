import * as React from "react";
import { Form } from "../../lib";

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
    }
];

export const BasicForm = () => (
    <Form
        name="basic-form"
        initialValues={initialValues}
        onSubmit={values => {
            console.log("Submitted with values", values);
        }}
        render={PrettyForm}
        renderProps={{
            fields,
            title: "Basic Form"
        }}
    />
);
