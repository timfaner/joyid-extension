import { EventEmitter } from "events";

import { RequestArguments } from "./eip-1193";

import { ProviderTransport } from "./types";

class JoyIdProvider extends EventEmitter {
  chainId = "0x1";

  selectedAddress: string | undefined;

  connected = false;

  requestResolvers = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (value: unknown) => void;
      sendData: {
        id: string;
        target: string;
        request: Required<RequestArguments>;
      };
    }
  >();

  constructor(public transport: ProviderTransport) {
    super();

    /**
     * Some dApps may have a problem with preserving a reference to a provider object.
     * This is the result of incorrect assignment.
     * In such a case, the object this is undefined
     * which results in an error in the execution of the request.
     * The request function should always have a provider object set.
     */
    this.request = this.request.bind(this);
  }

  private internalBridgeListener(event: unknown): void {
    let id;
    let result: unknown;

    if (isWindowResponseEvent(event)) {
      if (
        event.origin !== this.transport.origin || // filter to messages claiming to be from the provider-bridge script
        event.source !== window || // we want to recieve messages only from the provider-bridge script
        event.data.target !== WINDOW_PROVIDER_TARGET
      ) {
        return;
      }

      id = event.data.id;
      result = event.data.result;
    } else if (isPortResponseEvent(event)) {
      id = event.id;
      result = event.result;
    } else {
      return;
    }

    const requestResolver = this.requestResolvers.get(id);

    if (!requestResolver) return;

    const { sendData, reject, resolve } = requestResolver;

    this.requestResolvers.delete(sendData.id);

    const { method: sentMethod } = sendData.request;

    if (isEIP1193Error(result)) {
      reject(result);
    }

    // let's emit connected on the first successful response from background
    if (!this.connected) {
      this.connected = true;
      this.emit("connect", { chainId: this.chainId });
    }

    switch (sentMethod) {
      case "wallet_switchEthereumChain":
      case "wallet_addEthereumChain":
        // null result indicates successful chain change https://eips.ethereum.org/EIPS/eip-3326#specification
        if (result === null) {
          this.handleChainIdChange(
            (sendData.request.params[0] as { chainId: string }).chainId,
          );
        }
        break;

      case "eth_chainId":
      case "net_version":
        if (
          typeof result === "string" &&
          Number(this.chainId) !== Number(result)
        ) {
          this.handleChainIdChange(result);
        }
        break;

      case "eth_accounts":
      case "eth_requestAccounts":
        if (Array.isArray(result) && result.length !== 0) {
          this.handleAddressChange(result);
        }
        break;

      default:
        break;
    }

    resolve(result);
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Provider-wide counter for requests.
  private requestID = 0n;

  request(arg: RequestArguments): Promise<unknown> {
    const { method, params = [] } = arg;
    if (typeof method !== "string") {
      return Promise.reject(new Error(`unsupported method type: ${method}`));
    }

    const sendData = {
      id: this.requestID.toString(),
      target: PROVIDER_BRIDGE_TARGET,
      request: {
        method,
        params,
      },
    };

    this.requestID += 1n;

    this.transport.postMessage(sendData);

    return new Promise<unknown>((resolve, reject) => {
      this.requestResolvers.set(sendData.id, {
        resolve,
        reject,
        sendData,
      });
    });
  }

  override emit(event: string | symbol, ...args: unknown[]): boolean {
    const hadAdditionalListeners = window.walletRouter?.reemitTahoEvent(
      event,
      ...args,
    );

    const hadDirectListeners = super.emit(event, ...args);

    return hadAdditionalListeners || hadDirectListeners;
  }

  handleChainIdChange(chainId: string): void {
    this.chainId = chainId;
    this.emit("chainChanged", chainId);
    this.emit("networkChanged", Number(chainId).toString());
  }

  handleAddressChange(address: Array<string>): void {
    if (this.selectedAddress !== address[0]) {
      // eslint-disable-next-line prefer-destructuring
      this.selectedAddress = address[0];
      this.emit("accountsChanged", address);
    }
  }
}
