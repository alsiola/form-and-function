import { NotUndefinedMessage } from "./required";
import {
    Message,
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult
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
export const numeric = <T>(msg?: NumericMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{}>>
) => (value: string) => {
    if (typeof value === "undefined") {
        return valid();
    }

    const format = useFormatter(msg, { value }, formatter);

    return /^[0-9]*$/.test(value || "")
        ? valid()
        : invalid(format("nonNumeric", `Entered value must be a number`));
};
