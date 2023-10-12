import PortDuplexStream from "extension-port-stream";
import generateUniqueId from "generate-unique-id";
import { StreamPool } from "./streampool";
import { StreamData } from "./typed";

import {
    JOYID_APP_URL,
    JOYID_TEST_URL,
    CONTENT_STREAM_NAME,
    DEFAULT_JOYID_CONFIG,
} from "./constant";
import { initConfig } from "@joyid/evm";
import { getDefaultJoyidConfig } from "./utils";

function uiSetUp() {
    // 添加options 按钮
    chrome.runtime.onInstalled.addListener(function () {
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
    console.log(data);
    if (data === "joyid_getConfig") {
        chrome.storage.local.get("developer").then((value) => {
            const config = getDefaultJoyidConfig();
            if (!value.developer) {
                config.joyidAppURL = JOYID_APP_URL;
            }

            let response: StreamData = {
                isDeveloperMode: value.developer,
                evmConfig: config,
            };
            pool.send(stream_id, response);
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
        if (changes.developer) {
            let response: StreamData = {
                isDeveloperMode: changes.developer.newValue,
            };
            stream_pool.broadcastSend(response);
        }
    });
}

main();
