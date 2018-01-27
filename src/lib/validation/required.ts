import {
    Message,
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface NotUndefinedMessage<T = string, U = string> {
    undef?: Message<T, void, U>;
}

/**
 * Validates that a value is not undefined or zero-length
 * @param msg Error messages when invalid
 */
export const required = <T>(msg?: NotUndefinedMessage<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{}>>
) => (value: string) => {
    const format = useFormatter(msg, { value }, formatter);

    console.log({ valueRequired: value });

    return typeof value !== "undefined" && value.length > 0
        ? valid()
        : invalid(format("undef", `Required`));
};
