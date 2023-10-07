import { EventEmitter } from "events";

import { RequestArguments } from "./eip-1193";

import * as joyid from "@joyid/evm";

export class JoyIdProvider extends EventEmitter {
  endpointRpc = "https://ethereum.publicnode.com";

  chainId = "0x1";

  selectedAddress: string | undefined;

  connected = false;

  constructor() {
    super();

    this.request = this.request.bind(this);
  }

  isConnected(): boolean {
    return this.connected;
  }

  request(arg: RequestArguments): Promise<unknown> {
    const { method, params = [] } = arg;
    if (typeof method !== "string") {
      return Promise.reject(new Error(`unsupported method type: ${method}`));
    }

    switch (method) {
      case "eth_accounts":
      case "eth_requestAccounts":
        return new Promise<string[]>((resolve, reject) => {
          joyid
            .connect()
            .then((result) => {
              this.selectedAddress = result;
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
                this.selectedAddress = result;
                return joyid.signMessage((params as string[])[0], result);
              })
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          });
        }

      default:
        return fetch(this.endpointRpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method, params }),
        });
    }
  }
}
