import { Message } from "./typesAndGuards";

export type Formatter<T, U> = (x: T, params?: U) => string;

/**
 * Encapsulation of logic around null checking messages and
 * apply custom formatter if provided
 * T value type
 * U formatter input type
 * V params type
 * W message name
 */
export const useFormatter = <T, U, V, W extends string>(
    msg: Partial<Record<W, Message<U, T, V>>> | undefined,
    args: V,
    formatter?: Formatter<T, V>
) => (messageName: W, defaultMsg: string): string => {
    const message =
        msg && msg[messageName]
            ? typeof msg[messageName] === "function"
              ? (msg[messageName] as any)(args)
              : msg[messageName]
            : defaultMsg;
    return formatter ? formatter(message, args) : message;
};
