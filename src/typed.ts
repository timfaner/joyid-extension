export interface StorageData {
    developer?: boolean;
    chainlists?: string;
}

export interface StreamData {
    switchChain?: {
        chainId: string;
        networkVersion: string;
    };
    switchAccount?: {
        account: string;
    };
}
