import { MatchesMessages } from "./matches";
import {
    Reporters,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult,
    CreateValidator
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";
import { FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";

export interface EqualToParams {
    field: string;
}

/**
 * Validates that a value is the same as another field
 * @param params The field to match
 * @param msg Error messages when invalid
 */
export const equalTo = <T>(
    params: EqualToParams,
    msg?: MatchesMessages<T, string>
): CreateValidator => ({ valid, invalid }, options) => (
    value,
    fields: FieldMap
) => {
    const format = useFormatter(msg, { ...params, value }, options);

    if (value === fields[params.field].value) {
        return valid();
    } else {
        return invalid(format("different", `Must match ${params.field}`));
    }
};
