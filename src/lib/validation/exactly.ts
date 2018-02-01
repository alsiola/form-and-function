import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    FieldResult,
    CovalidatedFieldResult,
    CreateValidator
} from "./typesAndGuards";
import { Formatter, useFormatter } from "./formatter";
import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";

export interface ExactlyMessages<T = string, U = string, V = FieldValue> {
    different?: Message<T, ExactlyParams<V>, U>;
}

export interface ExactlyParams<T> {
    value: T;
}

/**
 * Validates that a value is exactly a provided value
 * @param params Value to match
 * @param msg Error messages when invalid
 */
export const exactly = <T, U>(
    params: ExactlyParams<U>,
    msg?: ExactlyMessages<T, string, U>
): CreateValidator<FieldResult, U, T, ExactlyParams<U>> => (
    { valid, invalid },
    options
) => (value, fields) => {
    const format = useFormatter(msg, { ...params, value }, options);

    if (((value as any) as U) === params.value) {
        return valid();
    } else {
        return invalid(format("different", `Must be ${params.value}`));
    }
};
