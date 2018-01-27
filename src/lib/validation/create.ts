import {
    CreateValidator,
    MessageParams,
    ValidFieldResult,
    InvalidFieldResult,
    CovalidatedFieldResult
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
    validationMap: Record<string, CreateValidator>,
    formatter?: Formatter<U, MessageParams<FieldValue, any>>
) => {
    return Object.entries(validationMap).reduce(
        (out, [key, value]) => ({
            ...out,
            [key]: value(
                { valid: validFn, invalid: invalidFn },
                formatter || (((x: string) => x) as any)
            )
        }),
        {}
    );
};
