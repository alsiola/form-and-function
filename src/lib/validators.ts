import { FieldValue } from "./index";

export type Reporter = (error?: string) => FieldResult;

export type ValidatorFn<T> = (
    x: T | undefined
) => FieldResult | Promise<FieldResult>;

export type ValidationFnWithReporters<
    T = FieldValue | undefined,
    U = any,
    V = any
> = (reporters: Reporters, formatter: Formatter<U, V>) => ValidatorFn<T>;

export type ParamaterizedValidationFn<T, U> = (
    ...params: any[]
) => ValidationFnWithReporters<T, U>;

export type MakeValidator<T, U, V = void> = (
    validationMap: Record<string, ValidationFnWithReporters<T, U>>,
    formatter?: Formatter<U, V>
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

export type Formatter<T, U> = (x: T, params?: U) => string;

/**
 * Passes the validation reporters to each entry in an object
 * @param validationMap Object of field validators { [ fieldName: string ]: ValidationFunction }
 */
const create = <T = FieldValue, U = string>(
    validationMap: Record<string, ValidationFnWithReporters<T, U>>,
    formatter: Formatter<U, MessageParams<FieldValue, any>> = ((x: string) =>
        x) as any
) => {
    return Object.entries(validationMap).reduce(
        (out, [key, value]) => ({
            ...out,
            [key]: value({ valid: validFn, invalid: invalidFn }, formatter)
        }),
        {}
    );
};

export type MessageParams<T, U = FieldValue> = T & {
    value: U;
};

// T is result type
// U is value type
// V is params type
export type Message<T, U, V> = T | ((a: MessageParams<U, V>) => T) | undefined;

export interface NotUndefinedMessage<T = string, U = string> {
    undef?: Message<T, void, U>;
}

export interface AtLeastXCharsMessages<T = string, U = string>
    extends NotUndefinedMessage<T, U> {
    short?: Message<T, { chars: number }, U>;
}

export interface AtMostXCharsMessages<T = string, U = string> {
    long: Message<T, { chars: number }, U>;
}

export interface NumericMessages<T = string, U = string>
    extends NotUndefinedMessage<T, U> {
    nonNumeric?: Message<T, void, U>;
}

export type ValidationFnCreator<T, U, V, W> = (
    params: T,
    msg?: U
) => ValidationFnWithReporters<V, W>;

// S value type
// T formatter input type
// U params type
// V message name
const useFormatter = <S, T, U, V extends string>(
    formatter: Formatter<S, U>,
    msg: Partial<Record<V, Message<T, S, U>>> | undefined,
    args: U
) => (messageName: V, defaultMsg: string): string => {
    return formatter(
        msg && msg[messageName]
            ? typeof msg[messageName] === "function"
              ? (msg[messageName] as any)(args)
              : msg[messageName]
            : defaultMsg,
        args
    );
};

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
const atLeast = <T>(
    params: { chars: number },
    msg?: AtLeastXCharsMessages<T, string>
) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{ chars: number }>>
) => (value: string) => {
    const format = useFormatter(formatter, msg, { ...params, value });

    if (!value) {
        return invalid(format("undef", `Please enter a value`));
    }

    return value.length >= params.chars
        ? valid()
        : invalid(
              format(
                  "short",
                  `Entry must be at least ${params.chars} characters long`
              )
          );
};

/**
 * Validates that a value is at most {chars} long
 * @param chars Maximum number of characters
 * @param msg Error messages when invalid
 */
const atMost = <T>(params: { chars: number }, msg: AtMostXCharsMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{ chars: number }>>
) => (value: string) => {
    if (!value) {
        return valid();
    }

    const format = useFormatter(formatter, msg, { ...params, value });

    return value.length <= params.chars
        ? valid()
        : invalid(
              format(
                  "long",
                  `Entry must be no more than ${params.chars} characters long`
              )
          );
};

/**
 * Validates that a value is only numbers
 * @param msg Error messages when invalid
 */
const numeric = <T>(msg?: NumericMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{}>>
) => (value: string) => {
    if (typeof value === "undefined") {
        return valid();
    }

    const format = useFormatter(formatter, msg, { value });

    return /^[0-9]*$/.test(value || "")
        ? valid()
        : invalid(format("nonNumeric", `Entered value must be a number`));
};

/**
 * Combines validators so that all must be valid
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
const all = <T, U>(
    validators: Array<ValidationFnWithReporters<T, U>>,
    combiner?: (errors: string[]) => string
) => (
    reporters: Reporters,
    formatter: Formatter<U, MessageParams<FieldValue, any>>
) => async (val: T) => {
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
    atLeast,
    atMost,
    all,
    create,
    numeric
};
