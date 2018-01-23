import { Messages } from "react-intl";

export const messages: Messages = {
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
