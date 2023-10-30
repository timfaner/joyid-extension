import { EvmConfig } from "@joyid/evm";
import { RequestArguments } from "./provider/eip-1193";

export interface StorageData {
    developer?: boolean;
    chainlists?: string;
}

export interface StreamData {
    isDeveloperMode?: boolean;
    evmConfig?: EvmConfig;
}

export interface RPCStreamData {
    type: string;
    payload: {
        id: string;
        request: RequestArguments;
    };
}

export interface RPCStreamResponse {
    type: string;
    payload: {
        id: string;
        result: string;
        error?: string;
    };
}
