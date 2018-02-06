const formAndFunction = require("../../../dist/form-and-function.cjs.js");

const atLeast = formAndFunction.validation.atLeast;

describe("atLeast", () => {
    it("calls useFormatter to get a formatter", () => {
        const useFormatter = jest.fn();

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };
        const options = { testOpt: "" };

        atLeast(params, msg)(
            { valid: jest.fn(), invalid: jest.fn() },
            useFormatter,
            options as any
        )("val");

        expect(useFormatter).toBeCalledWith(
            msg,
            {
                ...params,
                value: "val"
            },
            options
        );
    });

    it("calls valid when value contains at least x chars", () => {
        const valid = jest.fn();

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };
        const options = { testOpt: "" };

        atLeast(params, msg)(
            { valid, invalid: jest.fn() },
            jest.fn(),
            options as any
        )("longenough");

        expect(valid).toBeCalled();
    });

    it("calls invalid when value contains less than x chars", () => {
        const invalid = jest.fn();
        const formatter = jest.fn().mockReturnValue((x, y) => ({ x, y });

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };

        atLeast(params, msg)({ valid: jest.fn(), invalid }, formatter)("s");

        expect(invalid).toBeCalledWith({
            x: "short",
            y: "Entry must be at least 3 characters long"
        });
    });

    it("calls valid when numeric value contains at least x chars", () => {
        const valid = jest.fn();

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };
        const options = { testOpt: "" };

        atLeast(params, msg)(
            { valid, invalid: jest.fn() },
            jest.fn(),
            options as any
        )("55555");

        expect(valid).toBeCalled();
    });

    it("calls invalid when numeric value contains less than x chars", () => {
        const invalid = jest.fn();
        const formatter = jest.fn().mockReturnValue((x, y) => ({ x, y });

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };

        atLeast(params, msg)({ valid: jest.fn(), invalid }, formatter)(3);

        expect(invalid).toBeCalledWith({
            x: "short",
            y: "Entry must be at least 3 characters long"
        });
    });

    it("calls invalid when value is undefined", () => {
        const invalid = jest.fn();
        const formatter = jest.fn().mockReturnValue((x, y) => ({ x, y });

        const params = { chars: 3 };
        const msg = {
            short: "test"
        };

        atLeast(params, msg)({ valid: jest.fn(), invalid }, formatter)();

        expect(invalid).toBeCalledWith({
            x: "undef",
            y: "Please enter a value"
        });
    });
});
