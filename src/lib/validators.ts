import { FieldValue, FieldMap, FieldMeta, FieldRecordAny } from "./index";
/**
 * Needed to stop TS moaning
 */
export type A = FieldMeta;
export type B = FieldRecordAny;

export type Reporter = (error?: string) => FieldResult;

export type ResultTypes =
    | FieldResult
    | CovalidatedFieldResult
    | Promise<FieldResult | CovalidatedFieldResult>;

export type ValidatorFn<T, U = ResultTypes> = (
    x: T | undefined,
    fields?: FieldMap
) => U;

export type ValidationFnWithReporters<
    T = FieldValue | undefined,
    U = any,
    V = any,
    W = ResultTypes
> = (reporters: Reporters, formatter?: Formatter<U, V>) => ValidatorFn<T, W>;

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

export interface CovalidatedFieldResult {
    result: FieldResult;
    covalidate: string[];
}

export const isCovalidateResult = (
    a: FieldResult | CovalidatedFieldResult
): a is CovalidatedFieldResult => {
    return "result" in a;
};

export const isInvalidResult = (
    result: FieldResult
): result is InvalidFieldResult => {
    return !result.valid;
};

export const isValid = (
    result: FieldResult | CovalidatedFieldResult
): boolean => {
    return isCovalidateResult(result) ? result.result.valid : result.valid;
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
export const create = <T = FieldValue, U = string>(
    validationMap: Record<string, ValidationFnWithReporters<T, U>>,
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

export interface MatchesMessages<T = string, U = string> {
    different?: Message<T, void, U>;
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
    msg: Partial<Record<V, Message<T, S, U>>> | undefined,
    args: U,
    formatter?: Formatter<S, U>
) => (messageName: V, defaultMsg: string): string => {
    const message =
        msg && msg[messageName]
            ? typeof msg[messageName] === "function"
              ? (msg[messageName] as any)(args)
              : msg[messageName]
            : defaultMsg;
    return formatter ? formatter(message, args) : message;
};

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
export const matches = <T>(
    params: { field: string },
    msg?: MatchesMessages<T, string>
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MessageParams<{ field: string }>>
) => (value: string, fields: FieldMap) => {
    const format = useFormatter(msg, { ...params, value }, formatter);

    if (value === fields[params.field].value) {
        return valid();
    } else {
        return invalid(format("different", `Must match ${params.field}`));
    }
};

/**
 * Validates that a value is at least {chars} long
 * @param chars Minimum number of characters
 * @param msg Error messages when invalid
 */
export const atLeast = <T>(
    params: { chars: number },
    msg?: AtLeastXCharsMessages<T, string>
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MessageParams<{ chars: number }>>
) => (value: string) => {
    const format = useFormatter(msg, { ...params, value }, formatter);

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
export const atMost = <T>(
    params: { chars: number },
    msg: AtMostXCharsMessages<T>
) => (
    { valid, invalid }: Reporters,
    formatter?: Formatter<T, MessageParams<{ chars: number }>>
) => (value: string) => {
    if (!value) {
        return valid();
    }

    const format = useFormatter(msg, { ...params, value }, formatter);

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
export const numeric = <T>(msg?: NumericMessages<T>) => (
    { valid, invalid }: Reporters,
    formatter: Formatter<T, MessageParams<{}>>
) => (value: string) => {
    if (typeof value === "undefined") {
        return valid();
    }

    const format = useFormatter(msg, { value }, formatter);

    return /^[0-9]*$/.test(value || "")
        ? valid()
        : invalid(format("nonNumeric", `Entered value must be a number`));
};

/**
 * Combines validators so that all must be valid
 * @param validators Validators to combine
 * @param combiner How to combine error messages
 */
export const all = <T, U>(
    validators: Array<ValidationFnWithReporters<T, U>>,
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

    if (results.every(isValid)) {
        return reporters.valid();
    }

    const errors = results.filter(isInvalidResult).map(r => r.error);

    return reporters.invalid(
        combiner ? combiner(errors) : errors.join(" and ")
    );
};

export const covalidate = <T, U>(
    params: { fields: string[] },
    validator: ValidationFnWithReporters<
        T,
        U,
        any,
        FieldResult | Promise<FieldResult>
    >
) => (
    reporters: Reporters,
    formatter?: Formatter<U, MessageParams<FieldValue, any>>
) => async (val: T, fields: FieldMap): Promise<CovalidatedFieldResult> => {
    console.log({
        covalidate: params.fields,
        result: await validator(reporters, formatter)(val, fields)
    });
    return {
        covalidate: params.fields,
        result: await validator(reporters, formatter)(val, fields)
    };
};

const validation = {
    create,
    all,
    atLeast,
    atMost,
    covalidate,
    matches,
    numeric
};

export default validation;
