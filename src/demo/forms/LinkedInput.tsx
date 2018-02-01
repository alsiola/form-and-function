import * as React from "react";
import { Form } from "../../lib";

import { PrettyForm } from "../PrettyForm";
import { ReversingField } from "../ReversingField";

const fields = [
    {
        name: "field1",
        label: "Forward",
        reverse: false,
        key: "field1forward"
    },
    {
        name: "field1",
        label: "Reverse",
        reverse: true,
        key: "field1backward"
    }
];

export const LinkedInputForm = () => (
    <Form
        name="basic-form"
        onSubmit={values => {
            console.log("Submitted with values", values);
        }}
        render={PrettyForm}
        renderProps={{
            fields,
            title: "Linked Form"
        }}
    />
);
