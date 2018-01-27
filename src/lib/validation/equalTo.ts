import { MatchesMessages } from "./matches";
import {
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";
import { FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";

export interface EqualToParams {
    field: string;
}

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
export const equalTo = <T>(
    params: EqualToParams,
    msg?: MatchesMessages<T, string>
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MessageParams<EqualToParams>>
) => (value: string, fields: FieldMap) => {
    const format = useFormatter(msg, { ...params, value }, formatter);

    if (value === fields[params.field].value) {
        return valid();
    } else {
        return invalid(format("different", `Must match ${params.field}`));
    }
};
