import { WindowPostMessageStream } from "@metamask/post-message-stream";
import {
    CONSTEN_WINDOW_STREAM_NAME,
    DEFAULT_JOYID_CONFIG,
    INPAGE_WINDOW_STREAM_NAME,
} from "./constant";

export function getInpageStream() {
    return new WindowPostMessageStream({
        name: INPAGE_WINDOW_STREAM_NAME,
        target: CONSTEN_WINDOW_STREAM_NAME,
    });
}

export function enableDebug() {
    "use strict";
    const rubberNeck = {
        apply: function (tgt: any, thisArg: any, argList: any) {
            console.debug("apply", tgt.name, JSON.stringify(argList, null, 2));
            return Reflect.apply(tgt, thisArg, argList);
        },
    };
    const ethOrigi = window.ethereum;

    Object.getOwnPropertyNames(ethOrigi)
        .filter((i) => typeof ethOrigi[i] === "function")
        .forEach(
            (f) => (window.ethereum[f] = new Proxy(ethOrigi[f], rubberNeck)),
        );
    // Your code here...
}

import { initConfig, EvmConfig } from "@joyid/evm";

export function getDefaultJoyidConfig(): EvmConfig {
    return initConfig(DEFAULT_JOYID_CONFIG);
}
