import { Message } from "./typesAndGuards";

export type Formatter<T, U> = (x: T, params?: U) => string;

// S value type
// T formatter input type
// U params type
// V message name
export const useFormatter = <S, T, U, V extends string>(
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
