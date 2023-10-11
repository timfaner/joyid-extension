export interface StorageData {
    developer?: boolean;
    chainlists?: string;
}

export interface StreamData {
    isDeveloperMode?: boolean;
    chainConfig?: ChainConfig;
}

export interface ChainConfig {
    rpcURL: string;
    network: ChainNetwork;
}

export interface ChainNetwork {
    chainId: string;
    name: string;
}
