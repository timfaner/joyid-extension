document.addEventListener('DOMContentLoaded', function () {
  // 读取developer状态并设置开关
  chrome.storage.sync.get('developer', function (data) {
    document.getElementById('developerSwitch').checked = data.developer || false;
    updateChainSetupVisibility(data.developer);
  });
});

document.getElementById('uploadButton').addEventListener('click', function () {
  document.getElementById('chainFile').click();
});



document.getElementById('downloadTemplate').addEventListener('click', function() {
  var url = chrome.runtime.getURL('chainlists.json');
  var a = document.createElement('a');
  a.href = url;
  a.download = 'chainlists.json';
  a.click();
});

document.getElementById('developerSwitch').addEventListener('change', function () {
  var isChecked = this.checked;
  // 存储developer状态
  chrome.storage.sync.set({ developer: isChecked });
  updateChainSetupVisibility(isChecked);
});

document.getElementById('chainFile').addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    var content = e.target.result;
    chrome.storage.local.set({ chainlists: content });
  };
  reader.readAsText(file);
});


function updateChainSetupVisibility(isChecked) {
  var chainSetup = document.getElementById('chainSetup');
  chainSetup.style.display = isChecked ? 'block' : 'none';
}
