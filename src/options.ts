// 首先，定义可能的存储内容的类型
interface StorageData {
  developer?: boolean;
  chainlists?: string;
}

document.addEventListener('DOMContentLoaded', function () {
  
  const developerSwitch = document.getElementById('developerSwitch') as HTMLInputElement;
  const chainFile = document.getElementById('chainFile') as HTMLInputElement;
  const uploadButton = document.getElementById('uploadButton') as HTMLButtonElement;
  const downloadTemplate = document.getElementById('downloadTemplate') as HTMLButtonElement;

  // 读取developer状态并设置开关
  chrome.storage.local.get('developer', (data: StorageData) => {
    developerSwitch.checked = data.developer || false;
    updateChainSetupVisibility(data.developer || false);
  });

  developerSwitch.addEventListener('change', function () {
    const isChecked = this.checked;
    // 存储developer状态
    chrome.storage.local.set({ developer: isChecked });
    updateChainSetupVisibility(isChecked);
  });

  uploadButton.addEventListener('click', function () {
    chainFile.click();
  });

  chainFile.addEventListener('change', function(event) {
    if (!event || !event.target) return;

    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files && inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      if (!e.target) return;
      const content = e.target.result as string;
      chrome.storage.local.set({ chainlists: content });
    };
    reader.readAsText(file);
  });
  
  downloadTemplate.addEventListener('click', function() {
    var url = chrome.runtime.getURL('chainlists.json');
    var a = document.createElement('a');
    a.href = url;
    a.download = 'chainlists.json';
    a.click();
  });
  
});

function updateChainSetupVisibility(isChecked: boolean): void {
  const chainSetup = document.getElementById('chainSetup')!;
  chainSetup.style.display = isChecked ? 'block' : 'none';
}
