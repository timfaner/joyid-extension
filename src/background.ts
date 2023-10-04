import PortDuplexStream from "extension-port-stream";
import generateUniqueId from "generate-unique-id";

import { JOYID_APP_URL, JOYID_TEST_URL, CONTENT_STREAM_NAME } from "./constant";

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

chrome.runtime.onConnect.addListener((port) => {
  console.debug("Connect income", port.name);
  if (port.name === CONTENT_STREAM_NAME) {
    const portStream = new PortDuplexStream(port);
    registPortStream(portStream);
  }
});

chrome.storage.onChanged.addListener((changes) => {
  console.log("11");
  portStreamList.forEach((v, k) => v.write(changes.developer));
});

let portStreamID = "";
const portStreamList = new Map<string, PortDuplexStream>();

function onClose(portStreamID: string) {
  return () => {
    console.debug(`portstream ${portStreamID} closed`);
    portStreamList.delete(portStreamID);
  };
}

function onError(portStreamID: string) {
  return (err: Error) => {
    console.error(err, portStreamID);
  };
}

function onData(portStreamID: string) {
  return (data: any) => {
    console.log(data, portStreamID);
  };
}
//注册port steam
function registPortStream(portStream: PortDuplexStream): void {
  portStreamID = generateUniqueId();
  portStreamList.set(portStreamID, portStream);

  portStream.on("data", onData(portStreamID));
  portStream.on("close", onClose(portStreamID));
  portStream.on("error", onError(portStreamID));

  portStream.write(`background connected, your id is ${portStreamID}`);
  console.debug(`Connect id is ${portStreamID}`);
}
