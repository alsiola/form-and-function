import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";

export interface MatchesParams {
    regex: RegExp;
}

export interface MatchesMessages<T = string, U = string> {
    different?: Message<T, void, U>;
}

/**
 * Validates that a value is at most {chars} long
 * @param chars Maximum number of characters
 * @param msg Error messages when invalid
 */
export const matches = <T>(params: MatchesParams, msg?: MatchesMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MatchesParams>
) => (value: string) => {
    if (!value) {
        return valid();
    }

    const format = useFormatter(msg, { ...params, value }, formatter);

    return params.regex.test(value)
        ? valid()
        : invalid(format("different", `Must match pattern`));
};
