# form-and-function

form-and-function is a functional-inspired Form management library for React, written in TypeScript.

## What problem is solved?

Managing form state can be a pain, and the need for a form management abstraction is reasonably well
established. redux-form is great at what it does, but depends upon you using a particular state-management
solution. I wanted to create a state-management agnostic library (using simple component state by default) that
provides similar convenience and ease of use. Additionally, internationalization is supported from the outset.

## Examples

There are several examples in the `demo` folder of this repository. If anything is unclear then raise an issue,
or tweet me @bigalreturns

## Installation

Add the package to your React app using yarn or npm:

```
    yarn add form-and-function
```

react and react-dom are peer dependencies listed as version >= 15.x.x as this is what I have tested. There are no
direct dependencies.

## Usage

form-and-function relies upon render props, if you are unfamiliar with this concept then there is a great overview **here**.

There is no configuration, and no App level providers (no context was used in the making of this library!). Simply import the Form component and get to work.

The minimum usage of Form is as follows - notice that the Field component is injected as a Prop into the render method.
The `form` prop should be spread into the `form` element, and each fields `input` prop into their respective `input` elements.

```js
import React from "react";
import { Form } from "form-and-function";

export const YourApp = () => (
    <Form
        name="my-form"
        render={({ form, Field }) => (
            <form {...form}>
                <Field
                    name="my-field"
                    render={({ input }) => <input type="text" {...input} />}
                />
            </form>
        )}
    />
);
```

You are probably going to want to factor out those render methods into functional components:

```js
import React from "react";
import { Form } from "form-and-function";

const TextInput = ({ input }) => <input type="text" {...input} />;

const RenderForm = ({ form, Field }) => (
    <form {...form}>
        <Field name="my-field" render={TextInput} />
    </form>
);

export const YourApp = () => <Form name="my-form" render={RenderForm} />;
```

The chances are strong that your RenderForm component will also need some other props. We can provide those
using the `renderProps` prop on Form. These are then passed through to the render component within an `ownProps`
object. For example, we can give our form a title:

```js
import React from "react";
import { Form } from "form-and-function";

const TextInput = ({ input }) => <input type="text" {...input} />;

const RenderForm = ({ form, Field, ownProps: { title } }) => (
    <form {...form}>
        <h2>{title}</h2>
        <Field name="my-field" render={TextInput} />
    </form>
);

export const YourApp = () => (
    <Form
        name="my-form"
        render={RenderForm}
        renderProps={{
            title: "My smashing form!"
        }}
    />
);
```

The same principle applies when passing additional props down to our field renderers - we can give our fields labels:

```js
import React from "react";
import { Form } from "form-and-function";

const TextInput = ({ input, ownProps: { id, label } }) => (
    <label htmlFor={id}>
        <span>{label}</span>
        <input type="text" id={id} {...input} />
    </label>
);

const RenderForm = ({ form, Field, ownProps: { title } }) => (
    <form {...form}>
        <h2>{title}</h2>
        <Field
            name="my-field"
            render={TextInput}
            renderProps={{
                label: "Name",
                id: "name"
            }}
        />
    </form>
);

export const YourApp = () => (
    <Form
        name="my-form"
        render={RenderForm}
        renderProps={{
            title: "My smashing form!"
        }}
    />
);
```

### Validation

Validation follows a single route - a validators function is passed to the `Form` component, which should return entries
for any field that requires validation. This function is called with two "reporters" - `valid` and `invalid` - which
should be called by each individual field's validator depending on the validity of the field. `valid` takes
no arguments, and `invalid` should be called with a string describing the validation error.

A convenience function `validators.create` is provided, which will pass `valid` and `invalid` to each entry in
a provided object.

It's much easier to see it in some code, so if our form has fields named `firstName`, `telephone` and `password`,
and we want to validate `firstName`, we would use:

```js
import { Form, validation } from "form-and-function";

<Form
    validators={validation.create({
        firstName: ({ valid, invalid }) => value =>
            value.length < 3 ? valid() : invalid(`Must be more than 3 chars.`)
    })}
/>;
```

If this looks long-winded then say hello to some built in validators! Currently we provide the following:

* `validation.atLeast` - Is the value at least some length.
* `validation.atMost` - Is the value at most some length.
* `validation.numeric` - Is the value numeric only.

They can be used as follows:

#### numeric

```js
<Form
    validators={validation.create({
        age: validation.numeric()
    })}
/>
```

#### atLeast/atMost

```js
<Form
    validators={validation.create({
        firstName: validation.atLeast({ chars: 3 })
    })}
/>
```

#### Custom Validation Errors

If customised error messages are needed, then an object of error messages can be passed to the validator - the only
argument to `numeric`, or the second argument to `atLeast`/`atMost`.
A function can also be passed for each message, which will be called with the an object - the union of the inputted
value and the validator params, e.g. for `validation.atLeast`:

```js
{
    value: "whatever was entered",
    chars: 3
}
```

```js
<Form
    validators={validation.create({
        firstName: validation.atLeast(
            { chars: 3 },
            {
                short: ({ chars, value }) =>
                    `Please enter ${chars} characters minimum, you entered ${
                        value.length
                    }`,
                undef: "You must enter a message"
            }
        ),
        age: validation.numeric({
            nonNumeric: ({ value }) =>
                `Please enter a number - you entered ${value}`
        })
    })}
/>
```

#### Combining Validators

The inbuilt validators can be combined to validate on multiple conditions. As an example, we might want to
check if a field is numeric AND more than 5 characters. This is achieved with `validation.all`, which we can pass
an array of validators.

```js
<Form
    validators={validation.all({
        longNumber: validation.combine([
            validation.atLeast(
                { chars: 3 },
                {
                    short: ({ chars }) =>
                        `Please enter ${chars} characters minimum`,
                    undef: "You must enter a message"
                }
            ),
            validation.numeric({
                nonNumeric: "Please enter a number"
            })
        ])
    })}
/>
```

By default, error messages produced in `validation.all` are joined with " and " - this would produce an error such as:

`Please enter 3 characters minimum and Please enter a number`

Not quite perfect. We can pass a second argument to `validation.all`, which is an error combining function. It is passed
an array of strings, and should return a string.

```js
<Form
    validators={validation.all({
        longNumber: validation.combine([
            validation.atLeast({ chars: 3 }, {
                short: ({ chars }) => `${chars} characters minimum`,
                undef: "provided"
            }),
            validation.numeric({
                nonNumeric: "numbers only"
            })
        ], errors => "Please enter " + errors.join(", and also ")
    })}
/>
```

Now we will get a much nicer looking message:

`Please enter 3 characters minimum, and also numbers only`

### Internationalization

In the most part, `form-and-function` does not produce outputted strings but simply manages the form data, so i18n
is handled by your own code. The exception to this is in the generation of validation errors, which may need to
be translated. The validators above are all usable with an i18n library, such as react-intl, with very little effort.

These examples assume that your application has been set up with react-intl, and you are somewhat familiar with its concepts.

The `validation.create` function above has an optional second argument - a formatter. This formatter has the signature:

`type Formatter<T> = (x: T, params?: Record<string, any>) => string;`

Conveniently, this is the same signature as `react-intl`'s `formatMessage` function, which we can get in our component by using react-intl's `injectIntl` higher-order function. Using the custom messages option described previously, we can now return a react-intl `MessageDescriptor` instead of a string, and this will be passed to our `formatMessages` formatter, with
the arguments passed to the validator as the second argument, with the entered value under the `value` key, i.e.

```js
{
    chars: 3,
    value: "whatever was entered"
}
```

An internationalized form might use validators like this:

```js
// Wherever our messages are defined
const messages = {
    short: {
        id: "form.validation.short",
        defaultMessage: "At least {chars} characters"
    },
    undef: {
        id: "form.validation.undef",
        defaultMessage: "Must be provided"
    },
    nonNumeric: {
        id: "form.validation.nonNumeric",
        defaultMessage: "Numbers only, you entered {value}"
    }
};

// In our component
<Form
    validators={validation.create(
        {
            firstName: validation.atLeast(
                { chars: 3 },
                {
                    short: messages.short,
                    undef: messages.undef
                }
            ),
            age: validation.numeric({
                nonNumeric: messages.nonNumeric
            })
        },
        this.props.intl.formatMessage
    )}
/>;
```

If, as above, we name our messages using the same keys as the form validation messages, then we can just pass in the whole messages object and save some typing:

```js
<Form
    validators={validation.create(
        {
            firstName: validation.atLeast({ chars: 3 }, messages),
            age: validation.numeric(messages)
        },
        this.props.intl.formatMessage
    )}
/>
```
