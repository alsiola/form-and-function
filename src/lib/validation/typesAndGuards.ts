import { FieldValue, FieldMap } from "../Form";
import { FieldMeta, FieldRecordAny } from "../Field";
import { Formatter, useFormatter as formatter } from "./formatter";

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

/**
 * Options that can be passed to validator.create
 * T is type of formatter input
 * U is type of params
 */
export interface CreateValidatorOptions<T, U> {
    formatter?: Formatter<T, U>;
}

/**
 * A function that takes reporters and optionally a formatter and applies them to a ValidatorFn
 * T is type of validation result
 * U is type of field value
 * V is type of formatter input
 * W is type of validator params
 */
export type CreateValidator<
    T = ValidationResult,
    U = FieldValue | undefined,
    V = any,
    W = any
> = (
    reporters: Reporters,
    useFormatter: typeof formatter,
    options?: CreateValidatorOptions<V, W>
) => Validator<U, T>;

/**
 * Takes params and applies them to a ValidationFnWithReporters
 * params will be more specifically typed by individual validators
 * T is type of field value
 * U is type of validation result
 */
export type CreateParameterizedValidator<T, U> = (
    ...params: any[]
) => CreateValidator<T, U>;

/**
 * Combined type of value and params passed to a formatter
 * T is type of field value
 * U is type of validator params
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
