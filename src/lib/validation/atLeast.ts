import { NotUndefinedMessage } from "./required";
import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    MessageParams
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface AtLeastMessages<T = string, U = string>
    extends NotUndefinedMessage<T, U> {
    short?: Message<T, AtLeastParams, U>;
}

export interface AtLeastParams {
    chars: number;
}

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
export const atLeast = <T>(
    params: AtLeastParams,
    msg?: AtLeastMessages<T, string>
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MessageParams<AtLeastParams>>
) => (value: string) => {
    const format = useFormatter(msg, { ...params, value }, formatter);

    if (!value) {
        return invalid(format("undef", `Please enter a value`));
    }

    return value.length >= params.chars
        ? valid()
        : invalid(
              format(
                  "short",
                  `Entry must be at least ${params.chars} characters long`
              )
          );
};
