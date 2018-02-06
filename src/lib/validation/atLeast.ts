import { NotUndefinedMessage } from "./required";
import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult,
    MessageParams,
    CreateValidator,
    FieldResult
} from "./typesAndGuards";
import { Formatter } from "./formatter";

export interface AtLeastMessages<T = string, U = string>
    extends NotUndefinedMessage<T, U> {
    short?: Message<T, AtLeastParams, U>;
}

export interface AtLeastParams {
    chars: number;
}

/**
 * Validates that a value is at least {chars} long Formatter<T, MessageParams<AtLeastParams>>
 * T is type of formatter result
 * U is type of validation result
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
export const atLeast = <T, U>(
    params: AtLeastParams,
    msg?: AtLeastMessages<T, U>
): CreateValidator<FieldResult, U, T, AtLeastParams> => (
    { valid, invalid },
    useFormatter,
    options
) => value => {
    const format = useFormatter(msg, { ...params, value }, options);

    if (!value) {
        return invalid(format("undef", `Please enter a value`));
    }

    return value.toString().length >= params.chars
        ? valid()
        : invalid(
              format(
                  "short",
                  `Entry must be at least ${params.chars} characters long`
              )
          );
};
