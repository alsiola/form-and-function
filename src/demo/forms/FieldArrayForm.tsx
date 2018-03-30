import * as React from "react";
import { Form } from "../../lib";

import {
    Form as SURForm,
    Button,
    Message,
    Header,
    Input,
    Segment
} from "semantic-ui-react";

const initialValues = {
    myArray: ["123"]
};

export const FieldArrayForm = () => (
    <Form
        name="field-array-form"
        initialValues={initialValues}
        onSubmit={values => {
            console.log("Submitted with values", values);
        }}
        render={({
            form,
            meta: { valid, errors, submitted, isValidating, isSubmitting },
            actions: { reset },
            FieldArray
        }) => (
            <SURForm {...form} size="huge" error={true}>
                <Header>Field Arrays</Header>

                <FieldArray
                    name="myArray"
                    render={({ fields, addField, removeField }) => (
                        <>
                            {fields.map(({ input }, i) => (
                                <Segment key={i}>
                                    <Input {...input} />
                                    <Button
                                        type="button"
                                        onClick={removeField(i)}
                                    >
                                        Get rid
                                    </Button>
                                </Segment>
                            ))}
                            <Button type="button" onClick={addField}>
                                Another?
                            </Button>
                            <Button type="submit">I'm Done!</Button>
                        </>
                    )}
                />
            </SURForm>
        )}
    />
);
