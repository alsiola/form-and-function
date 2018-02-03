import { Component } from "react";
import { FormState } from "./Form";

/**
 * Internally state engine is used to allow Fields to retrieve/update
 * Forms state.  The library is agnostic to the mechanism of state
 * storage.
 */
export interface StateEngine<T extends object> {
    select: <U>(selector: (state: T) => U) => U;
    set: <K extends keyof T>(
        update: Pick<T, K> | ((s: T) => Pick<T, K>)
    ) => Promise<void>;
    get: () => T;
}

export type FormStateEngine = StateEngine<FormState>;

/**
 * Provides an implementation of StateEngine<FormState> using a
 * components internal state
 */
export const componentStateEngine = (
    componentInstance: Component<any, FormState>,
    initialState: FormState
): FormStateEngine => {
    componentInstance.state = initialState;
    return {
        select: selector => selector(componentInstance.state),
        set: update =>
            new Promise(r => componentInstance.setState(update as any, r)),
        get: () => componentInstance.state
    };
};
