import { NotUndefinedMessage } from "./required";
import {
    Message,
    Reporters,
    MessageParams,
    CreateValidator,
    ValidFieldResult,
    InvalidFieldResult,
    FieldResult,
    CovalidatedFieldResult
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface NumericMessages<T = string, U = string>
    extends NotUndefinedMessage<T, U> {
    nonNumeric?: Message<T, void, U>;
}

/**
 * Validates that a value is only numbers
 * @param msg Error messages when invalid
 */
export const numeric = <T, U>(
    msg?: NumericMessages<T>
): CreateValidator<FieldResult, U, T, MessageParams<U, {}>> => (
    { valid, invalid },
    options
) => value => {
    if (typeof value === "undefined") {
        return valid();
    }

    const format = useFormatter(msg, { value }, options);

    return /^[0-9]*$/.test(value ? value.toString() : "")
        ? valid()
        : invalid(format("nonNumeric", `Entered value must be a number`));
};
