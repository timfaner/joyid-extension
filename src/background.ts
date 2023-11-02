import PortDuplexStream from "extension-port-stream";
import { StreamPool } from "./streampool";
import { RPCStreamResponse, StreamData } from "./typed";

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {
    JOYID_APP_URL,
    JOYID_TEST_URL,
    CONTENT_STREAM_NAME,
    DEFAULT_DEVELOPER_MODE,
} from "./constant";
import { getDefaultJoyidConfig } from "./utils";

function sendRequest(method: string, params: any) {
    const rpcurl = getDefaultJoyidConfig().rpcURL;

    if (!rpcurl) {
        throw console.error("RPC URL is empty");
    }
    const transport = new HTTPTransport(rpcurl);
    const client = new Client(new RequestManager([transport]));
    return client.request({ method: method, params: params });
}

function uiSetUp() {
    chrome.runtime.onInstalled.addListener(function () {
        //初始化开发者模式
        chrome.storage.local.set({ developer: DEFAULT_DEVELOPER_MODE });

        // 添加options 按钮
        chrome.contextMenus.create({
            id: "options",
            title: "Options",
            contexts: ["action"],
        });
    });

    chrome.contextMenus.onClicked.addListener(function (info, tab) {
        if (info.menuItemId === "options") {
            chrome.runtime.openOptionsPage();
        }
    });

    // 注册 点击跳转功能
    chrome.action.onClicked.addListener(function (tab) {
        // 读取developer状态并决定打开哪个网站
        chrome.storage.local.get("developer", function (data) {
            if (data.developer) {
                chrome.tabs.create({ url: JOYID_TEST_URL });
            } else {
                chrome.tabs.create({ url: JOYID_APP_URL });
            }
        });
    });
}

function streamSetup(
    on_data_cb: (data: any, stream_id: string, that: StreamPool) => void,
): StreamPool {
    const stream_pool = new StreamPool(on_data_cb);
    // 监听新的数据流
    chrome.runtime.onConnect.addListener((port) => {
        console.debug("Connect income", port.name);
        if (port.name === CONTENT_STREAM_NAME) {
            const portStream = new PortDuplexStream(port);
            stream_pool.registPortStream(portStream);
        }
    });

    return stream_pool;
}

function router(data: any, stream_id: string, pool: StreamPool) {
    if (data === "joyid_getConfig") {
        console.debug(data);

        chrome.storage.local.get("developer").then((value) => {
            const config = getDefaultJoyidConfig();

            // 正式版config写入正式版网页url
            if (!value.developer) {
                config.joyidAppURL = JOYID_APP_URL;
            }

            let response: StreamData = {
                isDeveloperMode: value.developer,
                evmConfig: config,
            };
            console.debug(response, stream_id);
            pool.send(stream_id, response);
        });
    } else if (data === "ping") {
    } else {
        console.debug(data);
    }
    if (data.type === "rpc_request") {
        sendRequest(data.payload.request.method, data.payload.request.params)
            .then((result) => {
                let response: RPCStreamResponse = {
                    type: "rpc_response",
                    payload: {
                        id: data.payload.id,
                        result: result,
                    },
                };
                pool.send(stream_id, response);
            })
            .catch((err) => {
                let response: RPCStreamResponse = {
                    type: "rpc_response",
                    payload: {
                        id: data.payload.id,
                        error: err,
                    },
                };
                pool.send(stream_id, response);
                console.debug(err);
            });
    }
}

function main() {
    //设置插件ui逻辑
    uiSetUp();

    //设置stream 交互
    const stream_pool = streamSetup(router);

    //设置同步逻辑
    chrome.storage.onChanged.addListener((changes) => {
        // 开发者模式发生改变
        if (changes.developer) {
            let response: StreamData = {
                isDeveloperMode: changes.developer.newValue,
            };
            stream_pool.broadcastSend(response);
        }
    });
}

main();
