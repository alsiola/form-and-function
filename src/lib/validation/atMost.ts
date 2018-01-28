import {
    Message,
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult,
    CreateValidator
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface AtMostMessages<T = string, U = string> {
    long: Message<T, AtMostParams, U>;
}

export interface AtMostParams {
    chars: number;
}

/**
 * Validates that a value is at most {chars} long
 * @param chars Maximum number of characters
 * @param msg Error messages when invalid
 */
export const atMost = <T>(
    params: AtMostParams,
    msg?: AtMostMessages<T>
): CreateValidator => ({ valid, invalid }, formatter) => value => {
    if (!value) {
        return valid();
    }

    const format = useFormatter(msg, { ...params, value }, formatter);

    return value.toString().length <= params.chars
        ? valid()
        : invalid(
              format(
                  "long",
                  `Entry must be no more than ${params.chars} characters long`
              )
          );
};
