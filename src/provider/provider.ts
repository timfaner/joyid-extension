import { EventEmitter } from "events";

import { WindowPostMessageStream } from "@metamask/post-message-stream";

import { StreamData } from "../typed";

import { hexlify, toUtf8Bytes, getBytes } from "ethers";

import {
    RequestArguments,
    EIP1193Error,
    EIP1193_ERROR_CODES,
} from "./eip-1193";

import messages from "./message";

import * as joyid from "@joyid/evm";

import dequal from "fast-deep-equal";

import { isValidChainId, isValidNetworkVersion } from "./utils";

export type BaseProviderState = {
    accounts: null | string[];
    isConnected: boolean;
    initialized: boolean;
};

export class JoyIdProvider extends EventEmitter {
    _state: BaseProviderState;

    stream: WindowPostMessageStream;

    #networkVersion: string | null;

    static _defaultState: BaseProviderState = {
        accounts: null,
        isConnected: false,
        initialized: false,
    };

    isMetaMask: boolean;

    #chainId: string | null;

    #selectedAddress: string | null;

    constructor(config: joyid.EvmConfig, stream: WindowPostMessageStream) {
        super();

        joyid.initConfig(config);

        this.isMetaMask = true;

        this.#selectedAddress = null;
        this.#chainId = null;
        this.#networkVersion = null;

        this._state = {
            ...JoyIdProvider._defaultState,
        };

        this._handleAccountsChanged = this._handleAccountsChanged.bind(this);
        this._handleConnect = this._handleConnect.bind(this);
        this._handleChainChanged = this._handleChainChanged.bind(this);
        this._handleDisconnect = this._handleDisconnect.bind(this);
        this._handleStreamData = this._handleStreamData.bind(this);
        this._handleStreamError = this._handleStreamError.bind(this);
        this.request = this.request.bind(this);

        this.stream = stream;
        this.stream.on("data", this._handleStreamData);
        this.stream.on("error", this._handleStreamError);

        if (config.network) {
            this._initializeState({
                accounts: [],
                chainId: "0x" + config.network.chainId.toString(16),
                networkVersion: config.network.chainId.toString(10),
            });
        } else {
            this._initializeState();
        }
    }

    get chainId(): string | null {
        return this.#chainId;
    }

    get selectedAddress(): string | null {
        return this.#selectedAddress;
    }

    get networkVersion(): string | null {
        return this.#networkVersion;
    }

    isConnected(): boolean {
        return this._state.isConnected;
    }

    async request(arg: RequestArguments): Promise<unknown> {
        const { method, params = [] } = arg;
        if (typeof method !== "string") {
            console.error(`warning: ${method} function is not ready in joyid.`);
            return await Promise.reject(
                new EIP1193Error(
                    EIP1193_ERROR_CODES.unsupportedMethod,
                ).toJSON(),
            );
        }

        try {
            switch (method) {
                case "eth_accounts":
                    return this.#selectedAddress;

                case "eth_requestAccounts":
                    let addr = await joyid.connect();
                    if (addr !== this.#selectedAddress) {
                        this._handleAccountsChanged([addr]);
                    }
                    return [addr];

                case "personal_sign":
                    if (!this.#selectedAddress) {
                        let addr = await joyid.connect();
                        if (addr !== this.#selectedAddress) {
                            this._handleAccountsChanged([addr]);
                        }
                    }
                    let input: string | Uint8Array = (params as string[])[0];
                    input = input.match(/^0x[0-9A-Fa-f]*$/)
                        ? input
                        : hexlify(toUtf8Bytes(input));
                    input = getBytes(input);
                    return await joyid.signMessage(
                        input,
                        this.#selectedAddress as string,
                    );

                case "eth_chainId":
                    return this.#chainId;

                case "net_version":
                    return this.#networkVersion;

                case "eth_signTypedData_v3":
                case "eth_signTypedData_v4":
                    if (!this.#selectedAddress) {
                        let addr = await joyid.connect();
                        if (addr !== this.#selectedAddress) {
                            this._handleAccountsChanged([addr]);
                        }
                    }
                    let typedDataInput: string = (params as string[])[1];
                    return await joyid.signTypedData(
                        JSON.parse(typedDataInput),
                        this.#selectedAddress as string,
                    );

                default:
                    return await Promise.reject(
                        new EIP1193Error(
                            EIP1193_ERROR_CODES.unsupportedMethod,
                        ).toJSON(),
                    );
            }
        } catch (error) {
            return await Promise.reject(
                new EIP1193Error(
                    EIP1193_ERROR_CODES.userRejectedRequest,
                ).toJSON(),
            );
        }
    }

    _handleStreamData(data: StreamData) {
        if (data.isDeveloperMode !== undefined) {
            if (data.isDeveloperMode) {
                joyid.initConfig({
                    joyidAppURL: "https://testnet.joyid.dev",
                });
            } else {
                joyid.initConfig({
                    joyidAppURL: "https://app.joy.id",
                });
            }
        }

        if (data.evmConfig) {
            let rpcURL = data.evmConfig.rpcURL;
            let chainId = data.evmConfig.network?.chainId;
            if (chainId) {
                this._handleChainChanged({
                    chainId: chainId.toString(16),
                    networkVersion: chainId.toString(),
                });
            }
            if (rpcURL) {
                joyid.initConfig(rpcURL);
            }
        }
    }

    _handleStreamError(err: Error) {
        this._handleDisconnect(err.message);
    }

    /**
     * MUST be called by child classes.
     *
     * Sets initial state if provided and marks this provider as initialized.
     * Throws if called more than once.
     *
     * Permits the `networkVersion` field in the parameter object for
     * compatibility with child classes that use this value.
     *
     * @param initialState - The provider's initial state.
     * @param initialState.accounts - The user's accounts.
     * @param initialState.chainId - The chain ID.
     * @param initialState.networkVersion - The network version.
     * @fires BaseProvider#_initialized - If `initialState` is defined.
     * @fires BaseProvider#connect - If `initialState` is defined.
     */
    _initializeState(initialState?: {
        accounts: string[];
        chainId: string;
        networkVersion?: string;
    }) {
        if (this._state.initialized) {
            throw new Error("Provider already initialized.");
        }

        if (initialState) {
            const { accounts, chainId, networkVersion } = initialState;

            // EIP-1193 connect
            this._handleConnect(chainId);
            this._handleChainChanged({ chainId, networkVersion });
            this._handleAccountsChanged(accounts);
        }

        // Mark provider as initialized regardless of whether initial state was
        // retrieved.
        this._state.initialized = true;
        this.emit("_initialized");
    }

    /**
     * When the provider becomes connected, updates internal state and emits
     * required events. Idempotent.
     *
     * @param chainId - The ID of the newly connected chain.
     * @fires JoyIdInpageProvider#connect
     */
    _handleConnect(chainId: string) {
        if (!this._state.isConnected) {
            this._state.isConnected = true;
            this.emit("connect", { chainId });
            console.debug(messages.info.connected(chainId));
        }
    }

    /**
     * When the provider becomes disconnected, updates internal state and emits
     * required events. Idempotent with respect to the isRecoverable parameter.
     *
     * Error codes per the CloseEvent status codes as required by EIP-1193:
     * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes.
     */
    _handleDisconnect(errorMessage?: string) {
        if (this._state.isConnected) {
            this._state.isConnected = false;

            console.error(errorMessage);
            this.#chainId = null;
            this._state.accounts = null;
            this.#selectedAddress = null;

            this.emit("disconnect", errorMessage);
        }
    }

    _handleChainChanged({
        chainId,
        networkVersion,
    }: {
        chainId?: string | undefined;
        networkVersion?: string | undefined;
    } = {}) {
        if (
            !isValidChainId(chainId) ||
            !isValidNetworkVersion(networkVersion)
        ) {
            console.error(messages.errors.invalidNetworkParams(), {
                chainId,
                networkVersion,
            });
            return;
        }

        if (!isValidChainId(chainId)) {
            console.error(messages.errors.invalidNetworkParams(), {
                chainId,
            });
            return;
        }

        this._handleConnect(chainId);

        if (chainId !== this.#chainId) {
            this.#chainId = chainId;
            if (this._state.initialized) {
                this.emit("chainChanged", this.#chainId);
            }
        }
        if (
            this._state.isConnected &&
            networkVersion !== this.#networkVersion
        ) {
            this.#networkVersion = networkVersion as string;
            if (this._state.initialized) {
                this.emit("networkChanged", this.#networkVersion);
            }
        }
    }

    /**
     * Called when accounts may have changed. Diffs the new accounts value with
     * the current one, updates all state as necessary, and emits the
     * accountsChanged event.
     *
     * @param accounts - The new accounts value.
     * @param isEthAccounts - Whether the accounts value was returned by
     * a call to eth_accounts.
     */
    _handleAccountsChanged(accounts: unknown[], isEthAccounts = false): void {
        let _accounts = accounts;

        if (!Array.isArray(accounts)) {
            console.error(
                "JoyId: Received invalid accounts parameter. Please report this bug.",
                accounts,
            );
            _accounts = [];
        }

        for (const account of accounts) {
            if (typeof account !== "string") {
                console.error(
                    "JoyId: Received non-string account. Please report this bug.",
                    accounts,
                );
                _accounts = [];
                break;
            }
        }

        // emit accountsChanged if anything about the accounts array has changed
        if (!dequal(this._state.accounts, _accounts)) {
            // we should always have the correct accounts even before eth_accounts
            // returns
            if (isEthAccounts && this._state.accounts !== null) {
                console.error(
                    `JoyId: 'eth_accounts' unexpectedly updated accounts. Please report this bug.`,
                    _accounts,
                );
            }

            this._state.accounts = _accounts as string[];

            // handle selectedAddress
            if (this.#selectedAddress !== _accounts[0]) {
                this.#selectedAddress = (_accounts[0] as string) || null;
            }

            // finally, after all state has been updated, emit the event
            if (this._state.initialized) {
                const _nextAccounts = [..._accounts];
                this.emit("accountsChanged", _nextAccounts);
            }
        }
    }
}
