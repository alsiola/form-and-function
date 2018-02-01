import {
    CreateValidator,
    CreateValidatorOptions,
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
 * T is type of formatter result
 * U is type of validation result
 * @param params Fields to covalidated
 * @param validator Validator for this field
 */
export const covalidate = <T, U>(
    params: { fields: string[] },
    validator: CreateValidator<
        FieldResult | Promise<FieldResult>,
        FieldValue,
        T,
        U
    >
): CreateValidator<
    CovalidatedFieldResult | Promise<CovalidatedFieldResult>,
    FieldValue,
    T,
    U
> => (reporters, options) => async (val, fields) => {
    return {
        covalidate: params.fields,
        result: await validator(reporters, options as any)(val, fields)
    };
};
