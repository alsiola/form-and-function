import {
    CreateValidator,
    FieldResult,
    CovalidatedFieldResult,
    MessageParams,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    CreateValidatorOptions,
    ValidationResult,
    isValidResult,
    isInvalidResult
} from "./typesAndGuards";
import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";
import { Formatter } from "./formatter";

/**
 * Combines validators so that all must be valid
 * T is type of formatter result
 * U is type of validation result
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
export const all = (
    validators: CreateValidator[],
    combiner?: (errors: string[]) => string
): CreateValidator => (reporters, options) => async (
    val,
    fields
): Promise<FieldResult | CovalidatedFieldResult> => {
    const results = await Promise.all(
        validators.map(validator => validator(reporters, options)(val, fields))
    );

    if (results.every(isValidResult)) {
        return reporters.valid();
    }

    const errors = results.filter(isInvalidResult).map(r => r.error);

    return reporters.invalid(
        combiner ? combiner(errors) : errors.join(" and ")
    );
};
