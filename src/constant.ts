import { EvmConfig } from "@joyid/evm";

export const CONTENT_STREAM_NAME = "joyid_content_stream";

export const JOYID_APP_URL = "https://app.joy.id";
export const JOYID_TEST_URL = "https://testnet.joyid.dev";

export const TEMPLATE_FILE_NAME = "chainlists.json";

export const CONSTEN_WINDOW_STREAM_NAME = "joyid_content_window_stream";
export const INPAGE_WINDOW_STREAM_NAME = "joyid_inpage_window_stream";

export const DEFAULT_DEVELOPER_MODE = true;

export const DEFAULT_JOYID_CONFIG: EvmConfig = {
    // your app name log
    name: "Joyid extension",
    logo: "https://fav.farm/🆔",

    // optional, config for the network you want to connect to
    network: {
        chainId: 11155111,
        name: "Ethereum Sopelia",
    },
    // optional
    rpcURL: "https://endpoints.omniatech.io/v1/eth/sepolia/public",
};
