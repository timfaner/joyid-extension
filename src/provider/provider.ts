import { EventEmitter } from "events";

import { RequestArguments } from "./eip-1193";

import { rpcErrors, JsonRpcError } from "@metamask/rpc-errors";

import messages from "./message";

import * as joyid from "@joyid/evm";

import dequal from "fast-deep-equal";

import { isValidChainId, isValidNetworkVersion } from "./utils";

export type BaseProviderState = {
    accounts: null | string[];
    isConnected: boolean;
    initialized: boolean;
    isPermanentlyDisconnected: boolean;
};

export class JoyIdProvider extends EventEmitter {
    protected _state: BaseProviderState;

    #networkVersion: string | null;

    protected static _defaultState: BaseProviderState = {
        accounts: null,
        isConnected: false,
        initialized: false,
        isPermanentlyDisconnected: false,
    };

    isMetaMask: boolean;

    #chainId: string | null;

    #selectedAddress: string | null;

    constructor(config: joyid.EvmConfig) {
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
        this.request = this.request.bind(this);

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

    request(arg: RequestArguments): Promise<unknown> {
        if (!arg || typeof arg !== "object" || Array.isArray(arg)) {
            throw rpcErrors.invalidRequest({
                message: messages.errors.invalidRequestArgs(),
                data: arg,
            });
        }

        const { method, params = [] } = arg;
        if (typeof method !== "string") {
            return Promise.reject(
                new Error(`unsupported method type: ${method}`),
            );
        }

        switch (method) {
            case "eth_accounts":
            case "eth_requestAccounts":
                return new Promise<string[]>((resolve, reject) => {
                    joyid
                        .connect()
                        .then((result) => {
                            this.#selectedAddress = result;
                            resolve([result]);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                });

            case "personal_sign":
                if (this.selectedAddress) {
                    return joyid.signMessage(
                        (params as string[])[0],
                        this.selectedAddress as string,
                    );
                } else {
                    return new Promise<string>((resolve, reject) => {
                        joyid
                            .connect()
                            .then((result) => {
                                this.#selectedAddress = result;
                                return joyid.signMessage(
                                    (params as string[])[0],
                                    result,
                                );
                            })
                            .then((result) => {
                                resolve(result);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    });
                }

            case "eth_chainId":
                return new Promise<string>((resolve, reject) => {
                    resolve(this.#chainId as string);
                });

            case "net_version":
                return new Promise<string>((resolve, reject) => {
                    resolve(this.#networkVersion as string);
                });

            default:
                return new Promise((resolve, reject) => {
                    reject(
                        `warning: ${method} function is not ready in joyid.`,
                    );
                });
        }
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
    protected _initializeState(initialState?: {
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
    protected _handleConnect(chainId: string) {
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
     *
     * @param isRecoverable - Whether the disconnection is recoverable.
     * @param errorMessage - A custom error message.
     * @fires BaseProvider#disconnect - If the disconnection is not recoverable.
     */
    protected _handleDisconnect(isRecoverable: boolean, errorMessage?: string) {
        if (
            this._state.isConnected ||
            (!this._state.isPermanentlyDisconnected && !isRecoverable)
        ) {
            this._state.isConnected = false;

            let error;
            if (isRecoverable) {
                error = new JsonRpcError(
                    1013, // Try again later
                    errorMessage ?? messages.errors.disconnected(),
                );
                console.debug(error);
            } else {
                error = new JsonRpcError(
                    1011, // Internal error
                    errorMessage ?? messages.errors.permanentlyDisconnected(),
                );
                console.error(error);
                this.#chainId = null;
                this._state.accounts = null;
                this.#selectedAddress = null;
                this._state.isPermanentlyDisconnected = true;
            }

            this.emit("disconnect", error);
        }
    }

    protected _handleChainChanged({
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

        if (networkVersion === "loading") {
            this._handleDisconnect(true);
        } else {
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
    protected _handleAccountsChanged(
        accounts: unknown[],
        isEthAccounts = false,
    ): void {
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
