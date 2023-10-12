// 运行环境为 inpage
import { JoyIdProvider } from "./provider/provider";
import { getInpageStream } from "./utils";

let injectProvider: JoyIdProvider;

// 初始化 stream，与 background 通信
const stream = getInpageStream();

// 初始化 provider 并注入 window.ethereum 属性
injectProvider = new JoyIdProvider(stream);
window.ethereum = injectProvider;

// 监听注入是否成功
stream.once("error", (err) => {
    if (!injectProvider) {
        console.log(err);
    }
});
