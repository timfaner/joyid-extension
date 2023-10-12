import { isNumber, isObject, isString } from "./runtime-typecheck";

// EIP-1193 standard
export interface RequestArguments {
    readonly method: string;
    readonly params?: readonly unknown[] | object;
}

// EIP-1193 error
export const EIP1193_ERROR_CODES = {
    userRejectedRequest: {
        code: 4001,
        message: "The user rejected the request.",
    },
    unauthorized: {
        code: 4100,
        message:
            "The requested method and/or account has not been authorized by the user.",
    },
    unsupportedMethod: {
        code: 4200,
        message: "The Provider does not support the requested method.",
    },
    disconnected: {
        code: 4900,
        message: "The Provider is disconnected from all chains.",
    },
    chainDisconnected: {
        code: 4901,
        message: "The Provider is not connected to the requested chain.",
    },
} as const;

export type EIP1193ErrorPayload =
    (typeof EIP1193_ERROR_CODES)[keyof typeof EIP1193_ERROR_CODES] & {
        data?: unknown;
    };

export type EIP1193ErrorCodeNumbers = Pick<
    (typeof EIP1193_ERROR_CODES)[keyof typeof EIP1193_ERROR_CODES],
    "code"
>;

export class EIP1193Error extends Error {
    constructor(public eip1193Error: EIP1193ErrorPayload) {
        super(eip1193Error.message);
    }

    toJSON(): unknown {
        return this.eip1193Error;
    }
}

export function isEIP1193ErrorCodeNumber(
    code: unknown,
): code is EIP1193ErrorCodeNumbers {
    return (
        isNumber(code) &&
        Object.values(EIP1193_ERROR_CODES)
            .map((e) => e.code as number)
            .includes(code)
    );
}

export function isEIP1193Error(arg: unknown): arg is EIP1193ErrorPayload {
    return (
        isObject(arg) &&
        isNumber(arg.code) &&
        isEIP1193ErrorCodeNumber(arg.code) &&
        isString(arg.message)
    );
}
