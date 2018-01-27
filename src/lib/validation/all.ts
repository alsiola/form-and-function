import {
    CreateValidator,
    FieldResult,
    CovalidatedFieldResult,
    MessageParams,
    Reporters,
    ValidFieldResult,
    InvalidFieldResult,
    isValidResult,
    isInvalidResult
} from "./typesAndGuards";
import { FieldValue } from "../Form";
import { Formatter } from "./formatter";

/**
 * Combines validators so that all must be valid
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
export const all = <T, U>(
    validators: Array<CreateValidator<T, U>>,
    combiner?: (errors: string[]) => string
) => (
    reporters: Reporters,
    formatter: Formatter<U, MessageParams<FieldValue, any>>
) => async (val: T): Promise<FieldResult | CovalidatedFieldResult> => {
    const results = await Promise.all(
        validators.map(
            validator =>
                validator(reporters, formatter)(val) as Promise<
                    FieldResult | CovalidatedFieldResult
                >
        )
    );

    if (results.every(isValidResult)) {
        return reporters.valid();
    }

    const errors = results.filter(isInvalidResult).map(r => r.error);

    return reporters.invalid(
        combiner ? combiner(errors) : errors.join(" and ")
    );
};
