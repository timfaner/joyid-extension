import PortDuplexStream from "extension-port-stream";
import generateUniqueId from "generate-unique-id";

import { 
  JOYID_APP_URL,
  JOYID_TEST_URL,
  CONTENT_STREAM_NAME } from "./constant";



// 添加options 按钮

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'options',
    title: 'Options',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'options') {
    chrome.runtime.openOptionsPage();
  }
});

// 注册 点击跳转功能
chrome.action.onClicked.addListener(function(tab) {
  // 读取developer状态并决定打开哪个网站
  chrome.storage.local.get('developer', function(data) {
    if (data.developer) {
      chrome.tabs.create({ url: JOYID_TEST_URL });
    } else {
      chrome.tabs.create({ url: JOYID_APP_URL });
    }
  });
});



chrome.runtime.onConnect.addListener( ( port)=> 
    {
      if(port.name === CONTENT_STREAM_NAME){
        const portStream = new PortDuplexStream(port)
        registPortStream(portStream)
      }  
    })



chrome.storage.onChanged.addListener( (changes) =>{
  
  portStreamList.get("")?.write(changes.developer)
})



let portStreamID = "";
const portStreamList = new Map<string,PortDuplexStream>

//注册port steam
function registPortStream( portStream:PortDuplexStream):void{

  portStreamID = generateUniqueId()
  portStreamList.set( portStreamID ,portStream);
  portStream.on("data",(data) => { console.log("origindata");console.log(data)})

  portStream.on("close", () => {
    console.debug(`portstream ${portStreamID} closed`)
    portStreamList.delete(portStreamID)
  })

  portStream.on("error", (err) => console.error(err,portStreamID))

}
  



  