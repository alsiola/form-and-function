import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";
import { Formatter } from "./formatter";

/**
 * Produced by invalidFn to represent validation failure
 */
export interface InvalidFieldResult {
    valid: false;
    error: string;
}

/**
 * Produced by validFn to represent validation success
 */
export interface ValidFieldResult {
    valid: true;
}

export type FieldResult = ValidFieldResult | InvalidFieldResult;

/**
 * Wraps a FieldResult when a field is covalidated
 */
export interface CovalidatedFieldResult {
    result: FieldResult;
    covalidate: string[];
}

/**
 * Possible types of result from a validator function
 */
export type ValidationResult =
    | FieldResult
    | CovalidatedFieldResult
    | Promise<FieldResult | CovalidatedFieldResult>;

/**
 * Reporter functions as provided to validators
 */
export interface Reporters {
    valid: () => ValidFieldResult;
    invalid: (a: string) => InvalidFieldResult;
}

/**
 * A validator function takes a value of type T, and returns a validation result
 */
export type Validator<T, U = ValidationResult> = (
    value: T | undefined,
    fields?: FieldMap
) => U;

export interface CreateValidatorOptions<T, V> {
    formatter?: Formatter<T, V>;
}

/**
 * A function that takes reporters and optionally a formatter and applies them to a ValidatorFn
 * T is type of field value
 * U is type of formatter result
 * W is type of validation result
 */
export type CreateValidator<
    W = ValidationResult,
    T = FieldValue | undefined,
    U = any,
    V = any
> = (
    reporters: Reporters,
    options?: CreateValidatorOptions<U, V>
) => Validator<T, W>;

/**
 * Takes params and applies them to a ValidationFnWithReporters
 * params will be more specifically typed by individual validators
 */
export type CreateParameterizedValidator<T, U> = (
    ...params: any[]
) => CreateValidator<T, U>;

/**
 * Combined type of value and params passed to a formatter
 */
export type MessageParams<T = FieldValue, U = any> = U & {
    value: T;
};

/**
 * A message for a particular validation error
 * T is result type
 * U is value type
 * V is params type
 */
export type Message<T, U, V> = T | ((a: MessageParams<V, U>) => T) | undefined;

/**
 * Type guard for CovalidatedFieldResult
 * @param a FieldResult or CovalidatedFieldResult
 */
export const isCovalidateResult = (
    a: FieldResult | CovalidatedFieldResult
): a is CovalidatedFieldResult => {
    return "result" in a;
};

/**
 * Type guard for InvalidFieldResult
 * @param result FieldResult
 */
export const isInvalidResult = (
    result: FieldResult
): result is InvalidFieldResult => {
    return !result.valid;
};

/**
 * Type guard for ValidFieldResult
 * @param result FieldResult
 */
export const isValidResult = (
    result: FieldResult | CovalidatedFieldResult
): boolean => {
    return isCovalidateResult(result) ? result.result.valid : result.valid;
};
