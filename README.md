# form-and-function

form-and-function is a functional-inspired Form management library for React.

## What problem is solved?

Managing form state can be a pain, and the need for a form management abstraction is reasonably well
established. redux-form is great at what it does, but depends upon you using a particular state-management
solution. I wanted to create a state-management agnostic library (using simple component state by default) that
provides similar convenience and ease of use.

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
