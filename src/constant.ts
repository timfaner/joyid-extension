import { EvmConfig } from "@joyid/evm";

export const CONTENT_STREAM_NAME = "joyid_content_stream";

export const JOYID_APP_URL = "https://app.joyid.dev";
export const JOYID_TEST_URL = "https://testnet.joyid.dev";

export const TEMPLATE_FILE_NAME = "chainlists.json";

export const CONSTEN_WINDOW_STREAM_NAME = "joyid_content_window_stream";
export const INPAGE_WINDOW_STREAM_NAME = "joyid_inpage_window_stream";

export const DEFAULT_JOYID_CONFIG: EvmConfig = {
    // your app name
    name: "Joyid extension",

    // optional, config for the network you want to connect to
    network: {
        chainId: 1,
        name: "Ethereum Mainnet",
    },
    // optional
    rpcURL: "https://cloudflare-eth.com",
};
