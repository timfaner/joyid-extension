import { getInpageStream } from "./utils";

import { JoyIdProvider } from "./provider/provider";

let injectProvider = new JoyIdProvider();

if (!window.hasOwnProperty("abc")) {
  Object.defineProperty(window, "abc", {
    get() {
      return injectProvider;
    },
  });
} else {
  window.abc = injectProvider;
}

console.debug("Inject Success, Hello from inpage");

// const stream = getInpageStream();
// stream.on("data", (data) => console.log(data));
