import PortDuplexStream from "extension-port-stream";

let a = 1


chrome.runtime.onConnect.addListener( ( port)=> 
    {
        console.log("connected")
        const portStream = new PortDuplexStream(port)
        portStream.write("echo");
        portStream.on("data", (data) => console.log(data))
        
        chrome.action.onClicked.addListener((tab) => {
            portStream.write(a);
            a = a+1
            console.log("fire click")
        });
    })



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

  