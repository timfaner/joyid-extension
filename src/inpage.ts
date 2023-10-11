import { JoyIdProvider } from "./provider/provider";
import { StreamData } from "./typed";
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

const stream = getInpageStream();

stream.write("joyid_getConfig");
stream.on("data", (data: StreamData) => {
    console.log(data);
    if (data.isDeveloperMode) {
        console.log("Under developer mode");
    }
});

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
