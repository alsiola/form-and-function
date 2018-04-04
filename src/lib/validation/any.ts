import {
    CreateValidator,
    FieldResult,
    CovalidatedFieldResult,
    MessageParams,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    isValidResult,
    isInvalidResult,
    CreateValidatorOptions,
    ValidationResult
} from "./typesAndGuards";
import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";

/**
 * Combines validators so that at least one must be valid
 * T is type of formatter result
 * U is type of validation result
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
export const any = (
    validators: CreateValidator[],
    combiner?: (errors: string[]) => string
): CreateValidator => (reporters, formatter, options) => async (
    val,
    fields
) => {
    const results = await Promise.all(
        validators.map(validator =>
            validator(reporters, formatter, options)(val, fields)
        )
    );

    if (results.some(isValidResult)) {
        return reporters.valid();
    }

    const errors = results.filter(isInvalidResult).map(r => r.error);

    return reporters.invalid(combiner ? combiner(errors) : errors.join(" or "));
};
