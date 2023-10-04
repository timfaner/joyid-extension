import { TEMPLATE_FILE_NAME } from "./constant";
import { StorageData } from "./typed";
import { EvmConfig } from "@joyid/evm";

document.addEventListener("DOMContentLoaded", function () {
  const developerSwitch = document.getElementById(
    "developerSwitch",
  ) as HTMLInputElement;
  const chainFile = document.getElementById("chainFile") as HTMLInputElement;
  const uploadButton = document.getElementById(
    "uploadButton",
  ) as HTMLButtonElement;
  const downloadTemplate = document.getElementById(
    "downloadTemplate",
  ) as HTMLButtonElement;

  // 读取developer状态并设置开关
  chrome.storage.local.get("developer", (data: StorageData) => {
    developerSwitch.checked = data.developer || false;
    updateChainSetupVisibility(data.developer || false);
  });

  // 设置开发者模式按钮状态
  developerSwitch.addEventListener("change", function () {
    const isChecked = this.checked;
    // 存储developer mode 状态
    chrome.storage.local.set({ developer: isChecked });
    updateChainSetupVisibility(isChecked);
  });

  uploadButton.addEventListener("click", function () {
    chainFile.click();
  });

  //设置上传按钮
  chainFile.addEventListener("change", function (event) {
    console.log("upload");
    if (!event || !event.target) return;
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files && inputElement.files[0];

    if (!file) return;
    uploadFile(file);
  });

  // 下载文件
  downloadTemplate.addEventListener("click", function () {
    var url = chrome.runtime.getURL(TEMPLATE_FILE_NAME);
    var a = document.createElement("a");
    a.href = url;
    a.download = TEMPLATE_FILE_NAME;
    a.click();
  });
});

function uploadFile(file: File): void {
  const reader = new FileReader();
  reader.onload = function (e) {
    if (!e.target) return;
    const content = e.target.result as string;

    try {
      const joyid_config: EvmConfig = JSON.parse(content);

      //TODO: 使用ajv验证config格式
      chrome.storage.local.set({ joyid_config: joyid_config });
    } catch (error) {
      console.error(error);
      alert(error);
    }
  };
  reader.readAsText(file);
}

function updateChainSetupVisibility(isChecked: boolean): void {
  const chainSetup = document.getElementById("chainSetup")!;
  chainSetup.style.display = isChecked ? "block" : "none";
}
