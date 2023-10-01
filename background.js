chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
      id: 'options',
      title: 'Options',
      contexts: ['action']
    });
  });
  
  chrome.action.onClicked.addListener(function(tab) {
    // 读取developer状态并决定打开哪个网站
    chrome.storage.sync.get('developer', function(data) {
      if (data.developer) {
        chrome.tabs.create({ url: 'https://testnet.joyid.dev' });
      } else {
        chrome.tabs.create({ url: 'https://app.joyid.dev' });
      }
    });
  });
  
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === 'options') {
      chrome.runtime.openOptionsPage();
    }
  });
  