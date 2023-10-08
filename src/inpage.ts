import { getInpageStream } from "./utils";

import { JoyIdProvider } from "./provider/provider";

let config = {
  // your app name
  name: "EVM demo",
  // your app logo,
  logo: "https://fav.farm/🆔",
  // optional, config for the network you want to connect to
  network: {
    chainId: 80001,
    name: "Ethereum Mainnet",
  },
  // optional
  rpcURL: "https://cloudflare-eth.com",
};

let injectProvider = new JoyIdProvider(config);

Object.defineProperty(window, "ethereum", {
  get() {
    return injectProvider;
  },
  set(newProvider) {
    return injectProvider;
  },
  configurable: true,
});

console.debug("Inject Success, Hello from inpage");

// const stream = getInpageStream();
// stream.on("data", (data) => console.log(data));
