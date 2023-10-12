import { EvmConfig } from "@joyid/evm";

export interface StorageData {
    developer?: boolean;
    chainlists?: string;
}

export interface StreamData {
    isDeveloperMode?: boolean;
    evmConfig?: EvmConfig;
}
