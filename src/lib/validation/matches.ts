import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult,
    CreateValidator
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface MatchesParams {
    regex: RegExp;
}

export interface MatchesMessages<T = string, U = string> {
    different?: Message<T, void, U>;
}

/**
 * Validates that a value matches a RegExp
 * @param params The RegExp against which to test the value
 * @param msg Error messages when invalid
 */
export const matches = <T>(
    params: MatchesParams,
    msg?: MatchesMessages<T>
): CreateValidator => ({ valid, invalid }, options) => (value: string) => {
    if (!value) {
        return valid();
    }

    const format = useFormatter(msg, { ...params, value }, options);

    return params.regex.test(value)
        ? valid()
        : invalid(format("different", `Must match pattern`));
};
