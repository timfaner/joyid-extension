const messages = {
    errors: {
        disconnected: () =>
            "JoyId: Disconnected from chain. Attempting to connect.",
        permanentlyDisconnected: () =>
            "JoyId: Disconnected from JoyId background. Page reload required.",
        sendSiteMetadata: () =>
            `JoyId: Failed to send site metadata. This is an internal error, please report this bug.`,
        unsupportedSync: (method: string) =>
            `JoyId: The JoyId Ethereum provider does not support synchronous methods like ${method} without a callback parameter.`,
        invalidDuplexStream: () =>
            "Must provide a Node.js-style duplex stream.",
        invalidNetworkParams: () =>
            "JoyId: Received invalid network parameters. Please report this bug.",
        invalidRequestArgs: () =>
            `Expected a single, non-array, object argument.`,
        invalidRequestMethod: () => `'args.method' must be a non-empty string.`,
        invalidRequestParams: () =>
            `'args.params' must be an object or array if provided.`,
        invalidLoggerObject: () =>
            `'args.logger' must be an object if provided.`,
        invalidLoggerMethod: (method: string) =>
            `'args.logger' must include required method '${method}'.`,
    },
    info: {
        connected: (chainId: string) =>
            `JoyId: Connected to chain with ID "${chainId}".`,
    },
    warnings: {
        // deprecated properties
        chainIdDeprecation: `JoyId: 'ethereum.chainId' is deprecated and may be removed in the future. Please use the 'eth_chainId' RPC method instead.\nFor more information, see: https://github.com/JoyId/JoyId-improvement-proposals/discussions/23`,
        networkVersionDeprecation: `JoyId: 'ethereum.networkVersion' is deprecated and may be removed in the future. Please use the 'net_version' RPC method instead.\nFor more information, see: https://github.com/JoyId/JoyId-improvement-proposals/discussions/23`,
        selectedAddressDeprecation: `JoyId: 'ethereum.selectedAddress' is deprecated and may be removed in the future. Please use the 'eth_accounts' RPC method instead.\nFor more information, see: https://github.com/JoyId/JoyId-improvement-proposals/discussions/23`,
        // deprecated methods
        enableDeprecation: `JoyId: 'ethereum.enable()' is deprecated and may be removed in the future. Please use the 'eth_requestAccounts' RPC method instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1102`,
        sendDeprecation: `JoyId: 'ethereum.send(...)' is deprecated and may be removed in the future. Please use 'ethereum.sendAsync(...)' or 'ethereum.request(...)' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193`,
        // deprecated events
        events: {
            close: `JoyId: The event 'close' is deprecated and may be removed in the future. Please use 'disconnect' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#disconnect`,
            data: `JoyId: The event 'data' is deprecated and will be removed in the future. Use 'message' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#message`,
            networkChanged: `JoyId: The event 'networkChanged' is deprecated and may be removed in the future. Use 'chainChanged' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#chainchanged`,
            notification: `JoyId: The event 'notification' is deprecated and may be removed in the future. Use 'message' instead.\nFor more information, see: https://eips.ethereum.org/EIPS/eip-1193#message`,
        },
        rpc: {
            ethDecryptDeprecation: `JoyId: The RPC method 'eth_decrypt' is deprecated and may be removed in the future.\nFor more information, see: https://medium.com/JoyId/JoyId-api-method-deprecation-2b0564a84686`,
            ethGetEncryptionPublicKeyDeprecation: `JoyId: The RPC method 'eth_getEncryptionPublicKey' is deprecated and may be removed in the future.\nFor more information, see: https://medium.com/JoyId/JoyId-api-method-deprecation-2b0564a84686`,
            walletWatchAssetNFTExperimental: `JoyId: The RPC method 'wallet_watchAsset' is experimental for ERC721/ERC1155 assets and may change in the future.\nFor more information, see: https://github.com/JoyId/JoyId-improvement-proposals/blob/main/MIPs/mip-1.md and https://github.com/JoyId/JoyId-improvement-proposals/blob/main/PROCESS-GUIDE.md#proposal-lifecycle`,
        },
        // misc
        experimentalMethods: `JoyId: 'ethereum._JoyId' exposes non-standard, experimental methods. They may be removed or changed without warning.`,
    },
};
export default messages;
