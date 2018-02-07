# form-and-function

form-and-function is a functional-inspired Form management library for React, written in TypeScript.

## What problem is solved?

Managing form state can be a pain, and the need for a form management abstraction is reasonably well
established. redux-form is great at what it does, but depends upon you using a particular state-management
solution. I wanted to create a state-management agnostic library (using simple component state by default) that
provides similar convenience and ease of use.

Another issue is that of form validation. As a fan of functional programming, I wanted validators that were pure functions that could be composed at will. I think the approach in form-and-function provides a better developer experience than the use of, for example, JSON schema based validation.

Many modern applications need to be internationalized, and this can be an issue in form libraries. I18n has been considered from the start in the design of the API, with the aim of seamless integration with existing solutions.

In modern JavaScript development bundle size is always a concern - currently form-and-function weights in at just 3.54KB gzipped (14.87KB uncompressed).

## Contents

* [Examples](#examples)
* [Installation](#installation)
* [Usage](#usage)
    * [Form](#form)
    * [Field](#field)
    * [Validation](#validation)
        * [Built-In Validators](#built-in-validators)
        * [Custom Errors](#custom-validation-errors)
        * [Combining Validators](#combining-validators)
        * [Covalidating Fields](#covalidated-fields)
        * [Custom Validators](#writing-your-own-validators)
    * [Internationalization](#internationalization)
* [State Management](#state-management)

## Examples

There are several examples in the `demo` folder of this repository. They can be run locally by cloning this repository, installing dependencies and running `yarn start`. If anything is unclear then raise an issue, or tweet me @bigalreturns

## Installation

Add the package to your React app using yarn or npm:

```
    yarn add form-and-function
```

react and react-dom are peer dependencies listed as version >= 15.x.x as this is what I have tested. There are no direct dependencies. The current release version of form-and-function is 0.2.2

## Usage

form-and-function relies upon render props, if you are unfamiliar with this concept then there is a great overview [here](https://reactjs.org/docs/render-props.html)

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

### Form

The `Form` component will accept the following props:

* name (string, required) - The name of the form.
* render (component/function, required) - Function/functional component that will render the form - passed InjectedFormProps as below
* renderProps (object, optional) - Custom props to pass to the render component
* validators (object, optional) - Form validation object - see validation
* initialValues (object, optional) - Initial form values in the form `{ [fieldName]: value }`
* onSubmit (function, optional) - Called on form submission with form values. Should return void or Promise<void>
* onSubmitFailed (function, optional) - Called when submission fails due to validation errors, with form values. Should return void or Promise<void>
* onChange (function, optional) - Called when any form value changes, with all form values

The render component you provide will receive the following props:

* Field (Component) - A component to create fields
* form (object) - Props that must be passed to a <form> element
* values (object) - Current form values
* meta (object)
    * valid (boolean) - Is validation currently passing
    * submitted (boolean) - Has the form been submitted at any time
    * errors: (object) - Current errors for the form, { [fieldName]: { error: string }}
    * isValidating (boolean) - Is validation currently ongoing
    * isSubmitting (boolean) - Is submission currently ongoing
* actions (object)
    * reset (function) - Call to reset the form to initial values and clear validation errors
    * submit: (function) - Call to submit the form
* ownProps (object) - Any additional props passed via `renderProps` above

### Field

The `Field` component (as provided to the `Form` renderer), can be passed the following props:

* name (string, required) - The field name
* render (component/function, required) - Field renderer - passed InjectedFieldProps as below
* renderProps (object, optional) - Custom props to pass to the field renderer
* onChange (function, optional) - Called with the change event, and the field value, whenever the field value changes I.e. (e: SyntheticEvent, value: string | number | undefined) => void
* onFocus (function, optional) - Called with the focus event, and the field value, whenever the field value is focused
* onBlur (function, optional) - Called with the blur event, and the field value, whenever the field value is blurred

The render component passed to `Field` is provided with the following props. The input prop should generally be passed directly to the underlying <input> element, i.e. <input {...input} />

* meta (object)
    * valid (boolean) - Does the field pass validation
    * error (string | undefined) - Current validation error
    * pristine (boolean) - True if the field has the same value as its initial value
    * touched (boolean) - Has the field has ever been focused
    * active (boolean) - Is the field currently focused
    * isValidating (boolean) - Is the field currently being validated
* input (object)
    * onChange (function) - Called with (event, value) when the field value changes
    * onFocus (function) - Called with (event, value) when the field is focused
    * onBlur (function) - Called with (event, value) when the field is blurred
    * value (string | number | undefined) - Current field value
    * name (string) - Name of the field
* ownProps - Any custom props passed to `Field`s `renderProps`

### Validation

Validation follows a single route - a validators function is passed to the `Form` component, which should return an object with keys for any field that requires validation. This function is called with two "reporters" - `valid` and `invalid` - which should be called by each individual field's validator depending on the validity of the field. `valid` takes
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

#### Built In Validators

If this looks long-winded then say hello to some built in validators! Currently we provide the following:

* `validation.required` - Is the value defined, with a length of > 0 when converted to a string
* `validation.atLeast` - Is the value at least some length.
* `validation.atMost` - Is the value at most some length.
* `validation.numeric` - Is the value numeric only.
* `validation.equalTo` - Does the value match that of another field
* `validation.exactly` - Is the value exactly equal ( === ) to a specified value
* `validation.matches` - Does the value match a specified regular expression

They can be used as follows:

#### required

```js
<Form
    validators={validation.create({
        age: validation.required()
    })}
/>
```

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

#### equalTo

Ensure that `passwordConfirm` field is the same as `password` field.

```js
<Form
    validators={validation.create({
        passwordConfirm: validation.equalTo({ field: "password" })
    })}
/>
```

#### exactly

Is the entered value exactly "form-and-function"

```js
<Form
    validators={validation.create({
        repositoryName: validation.exactly({ value: "form-and-function" })
    })}
/>
```

#### matches

Is the entered value alphabetic only

```js
<Form
    validators={validation.create({
        repositoryName: validation.matches({ regex: /^[a-zA-Z]+$/ })
    })}
/>
```

#### Custom Validation Errors

If customised error messages are needed, then an object of error messages can be passed to the validator. If the validator takes parameters (e.g. atLeast ), then this is the second argument. If the validation takes no parameters (e.g. required ) then it is the only argument.
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

The inbuilt validators can be combined to validate on multiple conditions. `validation.all` ensures that all of an array of validators pass, `validation.any` ensures that at least one of a collection of validators pass.

As an example, we might want to check if a field is numeric AND more than 5 characters.

```js
<Form
    validators={validation.all({
        longNumber: validation.all([
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

By default, error messages produced in `validation.all` are joined with `" and "` - this would produce an error such as:

`Please enter 3 characters minimum and Please enter a number`

Not quite perfect. We can pass a second argument to `validation.all`, which is an error combining function. It is passed
an array of strings, and should return a string.

```js
<Form
    validators={validation.all({
        longNumber: validation.all([
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

#### Covalidated fields

It is not infrequent that the validation of a field depends upon the value of another field. For example, we might have a `password` field that requires its value be at least 8 characters long, and a `passwordConfirm` field that must match the `password` field. We could write these requirements like this:

```js
<Form
    validators={validation.create({
        password: validation.atLeast({ chars: 8 }),
        passwordConfirm: validation.equalTo({ field: "password" })
    })}
/>
```

This works, but if you try it out you will notice that the validation of `passwordConfirm` does not change when we are typing into the `password` field. Why is this? It's because by default, when a field changes, only the validator for that field's value is run. In our case when we change `password`, form-and-function will validate `password` only, not `passwordConfirm`.

Of course, we want to give feedback to our users on both fields. We can do this by using a covalidator to specify additional validators that should be run when a field's value changes. We want to run the `passwordConfirm` validator whenever `password` changes, so we create a covalidator on `password` as follows:

```js
<Form
    validators={validation.create({
        password: validation.covalidate(
            { fields: ["passwordConfirm"] },
            validation.atLeast({ chars: 8 })
        ),
        passwordConfirm: validation.matches({ field: "password" })
    })}
/>
```

#### Writing Your Own Validators

Although the provided validators cover a lot of sitations, undoubtedly at some point you will need to create your own. This is relatively simple. Validators must match the signature:

```js
interface ValidResult {
    valid: true;
}

interface InvalidResult {
    valid: false;
    error: string;
}

({ valid, invalid }) => value => ValidResult | InvalidResult | Promise<ValidResult | InvalidResult>
```

`valid` and `invalid` are functions that will generate appropriate results - if the value is valid then return `valid()`, if the value is invalid return `invalid("reason for invalidity")`. Asynchronous functions are fine, just return a Promise that will resolve to a validation result.

It's much easier to look at some example code, so let's make a validator that verifies that the provided value is an odd number of characters:

```js
const isOddLength = ({ valid, invalid }) => value => {
    // It's possible that value is undefined, so checking up front is a good idea
    if (typeof value === "undefined") {
        return invalid("Please enter a value");
    }

    if (value.length % 2 === 1) {
        return valid();
    } else {
        return invalid("Entered value must be an odd number of characters");
    }
};
```

We can now use the `isOddLength` validator like any other validator:

```js
<Form
    validators={validation.create({
        oddField: isOddLength
    })}
/>
```

### Internationalization

In the most part, `form-and-function` does not produce outputted strings but simply manages the form data, so i18n
is handled by your own code. The exception to this is in the generation of validation errors, which may need to
be translated. The validators above are all usable with an i18n library, such as react-intl, with very little effort.

These examples assume that your application has been set up with react-intl, and you are somewhat familiar with its concepts.

The `validation.create` function above has an optional second argument - an `options` object, which includes a formatter. This formatter has the signature:

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
        {
            formatter: this.props.intl.formatMessage
        }
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
        {
            formatter: this.props.intl.formatMessage
        }
    )}
/>
```

## State Management

One of the design goals was to create a library that was agnostic to the variety of state management used. I'm not certain that this is an easy target, or one that is achieved entirely, but the current attempt uses a prop on the `Form` component: `stateEngine`. This is an optional prop, and if not passed then `form-and-function` will create its own state engine that uses the internal state of the `Form` component. If supplied, this prop should be an object that fulfils the following interface:

```js
export interface StateEngine<T extends object> {
    select: <U>(selector: (state: T) => U) => U;
    set: <K extends keyof T>(
        update: Pick<T, K> | ((s: T) => Pick<T, K>)
    ) => Promise<void>;
    get: () => T;
}
```

Essentially, there should be a `select` function that runs the provided `selector` against the whole state, a `set` function that updates the state (with the same signature as React's `setState`, but returning a promise instead of using a callback), and a `get` function that returns the entire state.

The internal component-state stateEngine that is used by default looks like this - this is a function gets passed the componentInstance and the initialState, and returns the stateEngine. Currently, if you pass a `stateEngine` prop then it doesn't get provided with these arguments - but this part of the API is not nailed down.

```js
export const componentStateEngine = (
    componentInstance: Component<any, FormState>,
    initialState: FormState
): FormStateEngine => {
    componentInstance.state = initialState;
    return {
        select: selector => selector(componentInstance.state),
        set: update =>
            new Promise(r => componentInstance.setState(update as any, r)),
        get: () => componentInstance.state
    };
};
```

All state updates within `form-and-function` pass through this stateEngine, so providing an alternate will allow some external code to take over managing the entirety of the form's state. In the future the library may provided alternative stateEngines for you to use, such as a redux-connected one (if you believe form state should live in redux), or one using Apollo Client's local cache. For now, you're on your own.
