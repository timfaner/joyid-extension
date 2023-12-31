import { EventEmitter } from "events";

import { WindowPostMessageStream } from "@metamask/post-message-stream";

import { StreamData, RPCStreamRequest, RPCStreamResponse } from "../typed";

import { hexlify, toUtf8Bytes, getBytes } from "ethers";

import {
    RequestArguments,
    EIP1193Error,
    EIP1193_ERROR_CODES,
    isEIP1193Error,
} from "./eip-1193";

import messages from "./message";

import * as joyid from "@joyid/evm";

import dequal from "fast-deep-equal";

import { isValidChainId, isValidNetworkVersion } from "./utils";
import { JOYID_APP_URL, JOYID_TEST_URL } from "../constant";

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
    isJoyIDExtension: boolean;

    #chainId: string | null;

    #selectedAddress: string | null;

    requestResolvers = new Map<
        string,
        {
            resolve: (value: unknown) => void;
            reject: (value: unknown) => void;
            sendData: {
                id: string;
                request: Required<RequestArguments>;
            };
        }
    >();

    constructor(stream: WindowPostMessageStream) {
        super();

        // 与后端通信，拉取初始 config 以及接收配置信息
        this.stream = stream;
        this.stream.on("error", (err) => console.error("Init provider", err));

        // 一些 DApp 仅支持 metamask-like provider
        this.isMetaMask = true;

        // 调用这个方法以知道是否为joyid 插件
        this.isJoyIDExtension = true;

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

        // 拉取初始配置，同时监听事件更新配置信息
        stream.write("joyid_getConfig");
        this.stream.once("data", (data: StreamData) => {
            let config = data.evmConfig as joyid.EvmConfig;
            joyid.initConfig(config);

            console.debug(config);
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
        });

        // 监听 request 返回消息
        this.stream.on("data", (data: RPCStreamResponse) => {
            let id;
            let result;

            if (data.type === "rpc_response") {
                id = data.payload.id;
                result = data.payload.result;
                const requestResolver = this.requestResolvers.get(id);

                if (!requestResolver) return;

                const { sendData, reject, resolve } = requestResolver;

                this.requestResolvers.delete(sendData.id);

                const { method: sentMethod } = sendData.request;

                if (isEIP1193Error(result)) {
                    reject(result);
                }

                switch (sentMethod) {
                    case "eth_chainId":
                    case "net_version":
                        if (
                            typeof result === "string" &&
                            Number(this.chainId) !== Number(result)
                        ) {
                            this._handleChainChanged({
                                chainId: result,
                                networkVersion: result,
                            });
                        }
                        break;
                    default:
                        break;
                }
                resolve(result);
            }
        });
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

    private requestID = 0;

    /**
     * provider 主要方法，Dapp 调用 provider 的 request 方法发送请求
     * 按照 EIP-1193 标准，request 接受 RequestArguments 类型参数，返回 Promise
     * 如果 Promise resolve，需要包含返回的结果
     * 如果 Promise reject，需要包含拒绝的原因
     *
     * @param arg - 请求参数
     */

    // deprecated EIP-1193 method
    async enable(): Promise<unknown> {
        return this.request({ method: "eth_requestAccounts" });
    }
    async request(arg: RequestArguments): Promise<unknown> {
        const { method, params = [] } = arg;
        if (typeof method !== "string") {
            console.log(messages.errors.invalidRequestMethod());
            return await Promise.reject(
                new EIP1193Error(
                    EIP1193_ERROR_CODES.unsupportedMethod,
                ).toJSON(),
            );
        }

        // if (!this.#selectedAddress) {
        //     let addr = await joyid.connect();
        //     if (addr !== this.#selectedAddress) {
        //         this._handleAccountsChanged([addr]);
        //     }
        // }

        try {
            let data: any;
            switch (method) {
                case "eth_accounts":
                    return [this.#selectedAddress];

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

                    // 输入统一转化为 Uint8Array 类型
                    data = (params as string[])[0];
                    data = data.match(/^0x[0-9A-Fa-f]*$/)
                        ? data
                        : hexlify(toUtf8Bytes(data));
                    data = getBytes(data);
                    return await joyid.signMessage(
                        data,
                        this.#selectedAddress as string,
                    );

                // JoyId 中 signTypedData 实现的版本为 eth_signTypedData_v4
                case "eth_signTypedData_v3":
                case "eth_signTypedData_v4":
                    if (!this.#selectedAddress) {
                        let addr = await joyid.connect();
                        if (addr !== this.#selectedAddress) {
                            this._handleAccountsChanged([addr]);
                        }
                    }
                    data = (params as string[])[1];
                    return await joyid.signTypedData(
                        JSON.parse(data),
                        this.#selectedAddress as string,
                    );

                case "eth_sendTransaction":
                    if (!this.#selectedAddress) {
                        let addr = await joyid.connect();
                        if (addr !== this.#selectedAddress) {
                            this._handleAccountsChanged([addr]);
                        }
                    }
                    data = (params as joyid.TransactionRequest[])[0];
                    return await joyid.sendTransaction(
                        data,
                        this.#selectedAddress as string,
                    );

                case "eth_chainId":
                case "eth_blockNumber":
                case "eth_call":
                case "eth_estimateGas":
                case "eth_feeHistory":
                case "eth_gasPrice":
                case "eth_getBalance":
                case "eth_getBlockByHash":
                case "eth_getBlockByNumber":
                case "eth_getBlockTransactionCountByHash":
                case "eth_getBlockTransactionCountByNumber":
                case "eth_getCode":
                case "eth_getFilterChanges":
                case "eth_getFilterLogs":
                case "eth_getLogs":
                case "eth_getProof":
                case "eth_getStorageAt":
                case "eth_getTransactionByBlockHashAndIndex":
                case "eth_getTransactionByBlockNumberAndIndex":
                case "eth_getTransactionByHash":
                case "eth_getTransactionCount":
                case "eth_getTransactionReceipt":
                case "eth_getUncleByBlockHashAndIndex":
                case "eth_getUncleByBlockNumberAndIndex":
                case "eth_getUncleCountByBlockHash":
                case "eth_getUncleCountByBlockNumber":
                case "eth_maxPriorityFeePerGas":
                case "eth_newBlockFilter":
                case "eth_newFilter":
                case "eth_newPendingTransactionFilter":
                case "eth_protocolVersion":
                case "eth_sendRawTransaction":
                case "eth_subscribe":
                case "eth_syncing":
                case "eth_uninstallFilter":
                case "eth_unsubscribe":
                case "net_listening":
                case "net_version":
                case "web3_clientVersion":
                case "web3_sha3":
                    data = {
                        type: "rpc_request",
                        payload: {
                            id: this.requestID.toString(),
                            request: {
                                method,
                                params,
                            },
                        },
                    };
                    this.requestID += 1;
                    this.stream.write(data);
                    return await new Promise<unknown>((resolve, reject) => {
                        this.requestResolvers.set(data.payload.id, {
                            resolve,
                            reject,
                            sendData: data.payload,
                        });
                    });

                // 未实现的方法现在均返回 unsupportedMethod EIP-1193 Error
                // 打印 warning: ${method} function is not ready in joyid.
                default:
                    console.error(
                        `warning: ${method} function is not ready in joyid.`,
                    );
                    return await Promise.reject(
                        new EIP1193Error(
                            EIP1193_ERROR_CODES.unsupportedMethod,
                        ).toJSON(),
                    );
            }
        } catch (error) {
            // 对于用户拒绝请求或者 rpc 可能出现的错误，现在返回 userRejectedRequest EIP-1193 Error
            if (!isEIP1193Error(error)) {
                return await Promise.reject(
                    new EIP1193Error(
                        EIP1193_ERROR_CODES.userRejectedRequest,
                    ).toJSON(),
                );
            } else {
                return await Promise.reject(error);
            }
        }
    }

    // 监听 stream 事件，更新配置信息
    _handleStreamData(data: StreamData) {
        if (data.isDeveloperMode !== undefined) {
            if (data.isDeveloperMode) {
                joyid.initConfig({
                    joyidAppURL: JOYID_TEST_URL,
                });
            } else {
                joyid.initConfig({
                    joyidAppURL: JOYID_APP_URL,
                });
            }
        }

        if (data.evmConfig) {
            let rpcURL = data.evmConfig.rpcURL;
            let chainId = data.evmConfig.network?.chainId;
            if (chainId) {
                this._handleChainChanged({
                    chainId: "0x" + chainId.toString(16),
                    networkVersion: chainId.toString(),
                });
            }
            if (rpcURL) {
                joyid.initConfig(rpcURL);
            }
        }
    }

    // 监听 stream 事件，处理错误
    _handleStreamError(err: Error) {
        this._handleDisconnect(err.message);
    }

    /**
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

        this._handleConnect(chainId);

        if (chainId !== this.#chainId) {
            this.#chainId = chainId;
            this.emit("chainChanged", this.#chainId);
        }
        if (
            this._state.isConnected &&
            networkVersion !== this.#networkVersion
        ) {
            this.#networkVersion = networkVersion as string;
            this.emit("networkChanged", this.#networkVersion);
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
                this.emit("accountsChanged", [..._accounts]);
            }
        }
    }
}
