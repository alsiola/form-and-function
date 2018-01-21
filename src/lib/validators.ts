import { FieldValue } from "./index";

export type Reporter = (error?: string) => ValidationFieldResult;

export type ValidatorFn<T> = (x: T | undefined) => ValidationFieldResult;

export type ValidationFnWithReporters<T> = (
    reporters: FormValidArgs
) => ValidatorFn<T>;

export type ParamaterizedValidationFn<T> = (
    ...params: any[]
) => ValidationFnWithReporters<T>;

export type MakeValidator<T> = (
    validationMap: Record<string, ValidationFnWithReporters<T>>
) => Record<string, ValidatorFn<T>>;

export interface FormValidArgs {
    valid: () => ValidationFieldResult;
    invalid: (a: string) => ValidationFieldResult;
}

export type FormValidator<T> = {
    [key: string]: ValidationFnWithReporters<T>;
};

export interface ValidationFieldResult {
    valid: boolean;
    error: string;
}

export interface ValidationResult {
    [key: string]: ValidationFieldResult;
}

export const validFn: Reporter = () => ({
    valid: true,
    error: ""
});

export const invalidFn: Reporter = (error: string) => ({
    valid: false,
    error
});

const create: MakeValidator<FieldValue> = validationMap =>
    Object.entries(validationMap).reduce(
        (out, [key, value]) => ({
            ...out,
            [key]: value({ valid: validFn, invalid: invalidFn })
        }),
        {}
    );

export interface NotUndefinedMessage {
    undef?: () => string;
}

export interface AtLeastXCharsMessages extends NotUndefinedMessage {
    short?: (val: string) => string;
}

export interface AtMostXCharsMessages {
    long: (val: string) => string;
}

export interface NumericMessages extends NotUndefinedMessage {
    nonNumeric?: (val: string) => string;
}

const atLeastXChars = (
    chars: number,
    msg?: AtLeastXCharsMessages
): ValidationFnWithReporters<string> => ({ valid, invalid }) => val => {
    if (!val) {
        return invalid(msg && msg.undef ? msg.undef() : `Please enter a value`);
    }

    return val.length >= chars
        ? valid()
        : invalid(
              msg && msg.short
                  ? msg.short(val)
                  : `Entry must be at least ${chars} characters long`
          );
};

const atMostXChars = (
    chars: number,
    msg?: AtMostXCharsMessages
): ValidationFnWithReporters<string> => ({ valid, invalid }) => val => {
    if (!val) {
        return valid();
    }

    return val.length <= chars
        ? valid()
        : invalid(
              msg && msg.long
                  ? msg.long(val)
                  : `Entry must be no more than ${chars} characters long`
          );
};

const numeric = (msg?: NumericMessages): ValidationFnWithReporters<string> => ({
    valid,
    invalid
}) => val => {
    if (typeof val === "undefined") {
        return valid();
    }

    return /^[0-9]*$/.test(val || "")
        ? valid()
        : invalid(
              msg && msg.nonNumeric
                  ? msg.nonNumeric(val)
                  : `Entered value must be a number`
          );
};

const all = <T>(
    validators: Array<ValidationFnWithReporters<T>>,
    combiner?: (errors: string[]) => string
): ValidationFnWithReporters<T> => reporters => val => {
    const results = validators.map(validator => validator(reporters)(val));

    if (results.every(r => r.valid)) {
        return reporters.valid();
    }

    const errors = results.filter(r => !r.valid).map(r => r.error);

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
