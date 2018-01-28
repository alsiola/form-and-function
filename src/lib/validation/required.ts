import {
    Message,
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult,
    FieldResult,
    CovalidatedFieldResult,
    CreateValidator
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";
import { FieldValue } from "../Form";

export interface NotUndefinedMessage<T = string, U = string> {
    undef?: Message<T, void, U>;
}

/**
 * Validates that a value is not undefined or zero-length
 * @param msg Error messages when invalid
 */
export const required = <T, U>(
    msg?: NotUndefinedMessage<T>
): CreateValidator<FieldResult, U, T, MessageParams<U, {}>> => (
    { valid, invalid },
    options
) => value => {
    const format = useFormatter(msg, { value }, options);

    return typeof value !== "undefined" && value.toString().length > 0
        ? valid()
        : invalid(format("undef", `Required`));
};
