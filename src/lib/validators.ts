import { FieldValue } from "./index";

export type Reporter = (error?: string) => FieldResult;

export type ValidatorFn<T> = (
    x: T | undefined
) => FieldResult | Promise<FieldResult>;

export type ValidationFnWithReporters<
    T = FieldValue | undefined,
    U = string
> = (reporters: Reporters, formatter: Formatter<U>) => ValidatorFn<T>;

export type ParamaterizedValidationFn<T, U> = (
    ...params: any[]
) => ValidationFnWithReporters<T, U>;

export type MakeValidator<T, U> = (
    validationMap: Record<string, ValidationFnWithReporters<T, U>>,
    formatter?: Formatter<U>
) => Record<string, ValidatorFn<T>>;

export interface Reporters {
    valid: () => ValidFieldResult;
    invalid: (a: string) => InvalidFieldResult;
}

export type FormValidator<T, U> = Record<
    string,
    ValidationFnWithReporters<T, U>
>;

export type ValidationResult = Record<string, FieldResult>;

export type ValidationErrors = Record<string, InvalidFieldResult>;

export interface InvalidFieldResult {
    valid: false;
    error: string;
}

export interface ValidFieldResult {
    valid: true;
}

export type FieldResult = ValidFieldResult | InvalidFieldResult;

export const isInvalidResult = (
    result: FieldResult
): result is InvalidFieldResult => {
    return !result.valid;
};

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

export type Formatter<T> = (x: T, params?: Record<string, any>) => string;

/**
 * Passes the validation reporters to each entry in an object
 * @param validationMap Object of field validators { [ fieldName: string ]: ValidationFunction }
 */
const create = <T = FieldValue, U = string>(
    validationMap: Record<string, ValidationFnWithReporters<T, U>>,
    formatter: Formatter<U> = ((x: string) => x) as any
) => {
    return Object.entries(validationMap).reduce(
        (out, [key, value]) => ({
            ...out,
            [key]: value({ valid: validFn, invalid: invalidFn }, formatter)
        }),
        {}
    );
};

export interface NotUndefinedMessage<T = string> {
    undef?: () => T;
}

export interface AtLeastXCharsMessages<T = string>
    extends NotUndefinedMessage<T> {
    short?: (val: string) => T;
}

export interface AtMostXCharsMessages<T = string> {
    long: (val: string) => T;
}

export interface NumericMessages<T = string> extends NotUndefinedMessage<T> {
    nonNumeric?: (val: string) => T;
}

export type ValidationFnCreator<T, U, V, W> = (
    params: T,
    msg?: U
) => ValidationFnWithReporters<V, W>;

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
const atLeastXChars = <T>(
    params: { chars: number },
    msg?: AtLeastXCharsMessages<T>
) => ({ valid, invalid }: Reporters, formatter: Formatter<T>) => (
    val: string
) => {
    if (!val) {
        return invalid(
            formatter(
                msg && msg.undef
                    ? msg.undef()
                    : (`Please enter a value` as any),
                params
            )
        );
    }

    return val.length >= params.chars
        ? valid()
        : invalid(
              formatter(
                  msg && msg.short
                      ? msg.short(val)
                      : (`Entry must be at least ${
                            params.chars
                        } characters long` as any),
                  params
              )
          );
};

/**
 * Validates that a value is at most {chars} long
 * @param chars Maximum number of characters
 * @param msg Error messages when invalid
 */
const atMostXChars = <T>(
    params: { chars: number },
    msg: AtMostXCharsMessages<T>
) => ({ valid, invalid }: Reporters, formatter: Formatter<T>) => (
    val: string
) => {
    if (!val) {
        return valid();
    }

    return val.length <= params.chars
        ? valid()
        : invalid(
              formatter(
                  msg && msg.long
                      ? msg.long(val)
                      : (`Entry must be no more than ${
                            params.chars
                        } characters long` as any),
                  params
              )
          );
};

/**
 * Validates that a value is only numbers
 * @param msg Error messages when invalid
 */
const numeric = <T>(msg?: NumericMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T>
) => (val: string) => {
    if (typeof val === "undefined") {
        return valid();
    }

    return /^[0-9]*$/.test(val || "")
        ? valid()
        : invalid(
              formatter(
                  msg && msg.nonNumeric
                      ? msg.nonNumeric(val)
                      : (`Entered value must be a number` as any)
              )
          );
};

/**
 * Combines validators so that all must be valid
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
const all = <T, U>(
    validators: Array<ValidationFnWithReporters<T, U>>,
    combiner?: (errors: string[]) => string
): ValidationFnWithReporters<T, U> => (reporters, formatter) => async val => {
    const results = await Promise.all(
        validators.map(validator => validator(reporters, formatter)(val))
    );

    if (results.every(r => r.valid)) {
        return reporters.valid();
    }

    const errors = results.filter(isInvalidResult).map(r => r.error);

    return reporters.invalid(
        combiner ? combiner(errors) : errors.join(" and ")
    );
};

export const validation = {
    atLeastXChars,
    atMostXChars,
    all,
    create,
    numeric
};
