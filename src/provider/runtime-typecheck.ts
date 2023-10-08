import { WindowResponseEvent } from "./types";

import { RequestArguments } from "./eip-1193";

export function getType(arg: unknown): string {
    return Object.prototype.toString.call(arg).slice("[object ".length, -1);
}

export function isObject(
    arg: unknown,
): arg is Record<string | number | symbol, unknown> {
    return getType(arg) === "Object";
}

export function isArray(arg: unknown): arg is Array<unknown> {
    return Array.isArray(arg);
}

export function isUndefined(arg: unknown): arg is undefined {
    return typeof arg === "undefined";
}

export function isString(arg: unknown): arg is string {
    return getType(arg) === "String";
}

export function isNumber(arg: unknown): arg is number {
    return getType(arg) === "Number";
}

export function isMessageEvent(arg: unknown): arg is MessageEvent {
    return arg instanceof MessageEvent;
}

export function isRPCRequestParamsType(
    arg: unknown,
): arg is RequestArguments["params"] {
    return isObject(arg) || isArray(arg);
}

export function isWindowResponseEvent(
    arg: unknown,
): arg is WindowResponseEvent {
    return (
        isMessageEvent(arg) &&
        isString(arg.origin) &&
        !isUndefined(arg.source) &&
        isObject(arg.data) &&
        isString(arg.data.id) &&
        isString(arg.data.target) &&
        !isUndefined(arg.data.result)
    );
}
