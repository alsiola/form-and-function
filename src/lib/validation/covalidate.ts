import {
    CreateValidator,
    FieldResult,
    Reporters,
    MessageParams,
    CovalidatedFieldResult,
    ValidFieldResult,
    InvalidFieldResult
} from "./typesAndGuards";
import { Formatter } from "./formatter";
import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";

/**
 * Specify that other fields should be revalidated when this field changes
 * @param params Fields to covalidated
 * @param validator Validator for this field
 */
export const covalidate = <T, U>(
    params: { fields: string[] },
    validator: CreateValidator<T, U, any, FieldResult | Promise<FieldResult>>
) => (
    reporters: Reporters,
    formatter?: Formatter<U, MessageParams<FieldValue, any>>
) => async (val: T, fields: FieldMap): Promise<CovalidatedFieldResult> => {
    console.log({
        covalidate: params.fields,
        result: await validator(reporters, formatter)(val, fields)
    });
    return {
        covalidate: params.fields,
        result: await validator(reporters, formatter)(val, fields)
    };
};