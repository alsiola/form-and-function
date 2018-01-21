import { Component } from "react";
import { FormState } from "./Form";

export interface StateEngine<T> {
    select: <U>(selector: (state: T) => U) => U;
    set: <K extends keyof T>(
        update: Pick<T, K> | ((s: T) => Pick<T, K>)
    ) => Promise<void>;
    get: () => T;
}

export type FormStateEngine = StateEngine<FormState>;

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
