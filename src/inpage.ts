import { getInpageStream } from "./utils";

import { JoyIdProvider } from "./provider/provider";

let injectProvider = new JoyIdProvider();

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
