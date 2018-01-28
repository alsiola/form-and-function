import {
    CreateValidatorOptions,
    CreateValidator,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult,
    Validator
} from "./typesAndGuards";
import { Formatter } from "./formatter";
import { FieldValue } from "../Form";

/**
 * Passed to validation functions to be called when value is valid
 */
export const validFn = (): ValidFieldResult => ({
    valid: true
});

/**
 * Passed to validation functions to be called when value is invalid
 * @param error An error message - why is the value invalid?
 */
export const invalidFn = (error: string): InvalidFieldResult => ({
    valid: false,
    error
});

/**
 * Passes the validation reporters to each entry in an object
 * @param validationMap Object of field validators { [ fieldName: string ]: ValidationFunction }
 */
export const create = <T, U>(
    validationMap: Record<string, CreateValidator<T, FieldValue, U>>,
    options?: CreateValidatorOptions<U, MessageParams<FieldValue, any>>
): Record<string, Validator<FieldValue>> => {
    return Object.entries(validationMap).reduce(
        (out, [key, value]) => ({
            ...out,
            [key]: value({ valid: validFn, invalid: invalidFn }, options)
        }),
        {}
    );
};
