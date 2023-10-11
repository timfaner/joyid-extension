import { EvmConfig } from "@joyid/evm";
import { JoyIdProvider } from "./provider/provider";
import { StreamData } from "./typed";
import { getInpageStream } from "./utils";

let injectProvider: JoyIdProvider;

const stream = getInpageStream();

stream.write("joyid_getConfig");
stream.on("data", (data: StreamData) => {
    injectProvider = new JoyIdProvider(data.evmConfig as EvmConfig, stream);
    window.ethereum = injectProvider;
});

stream.on("error", (err) => {
    console.log("inject fail");
});
