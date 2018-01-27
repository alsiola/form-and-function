import {
    Message,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult
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
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, ExactlyParams<U>>
) => (value: U, fields: FieldMap) => {
    const format = useFormatter(msg, { ...params, value }, formatter);

    if (value === params.value) {
        return valid();
    } else {
        return invalid(format("different", `Must be ${params.value}`));
    }
};
