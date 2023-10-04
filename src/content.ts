import PortDuplexStream from "extension-port-stream";
import { CONTENT_STREAM_NAME,INPAGE_WINDOW_STREAM_NAME,CONSTEN_WINDOW_STREAM_NAME } from "./constant";
import { WindowPostMessageStream } from '@metamask/post-message-stream';

import {pipeline} from "stream"


function injectScript(jsPath:any) {
    jsPath = jsPath || 'inpage.js';
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('async', 'false');
        scriptTag.src = chrome.runtime.getURL(jsPath);
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);

        console.debug("inject success")
    } catch (error) {
        console.error('MetaMask: Provider injection failed.', error);
    }
    
}

function setUpBridge( inpageStream:WindowPostMessageStream, backgroundStream: PortDuplexStream){
    //设置双向pipeline
    pipeline(backgroundStream,inpageStream ,
        (err) =>
        { console.error("from portStram to inpage stream",err)})

    pipeline(inpageStream,backgroundStream ,
        (err) =>
            { console.error("from portStram to inpage stream",err)})
}

function main(){

    
    injectScript("inpage.js")

    const port = chrome.runtime.connect({name: CONTENT_STREAM_NAME})
    const backgroundStream = new PortDuplexStream(port)

    //需要在inpage注入后初始化inpageStream
    const inpageStream = new WindowPostMessageStream(
        {
            name:CONSTEN_WINDOW_STREAM_NAME,
            target:INPAGE_WINDOW_STREAM_NAME,
        }
    )

    setUpBridge(inpageStream,backgroundStream)
}




main()





