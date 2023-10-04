import PortDuplexStream from "extension-port-stream";
import { CONTENT_STREAM_NAME,INPAGE_WINDOW_STREAM_NAME,CONSTEN_WINDOW_STREAM_NAME } from "./constant";
import { WindowPostMessageStream } from '@metamask/post-message-stream';

import {pipeline} from "stream"

console.log("injectd")
const port = chrome.runtime.connect({name: CONTENT_STREAM_NAME})
const portStream = new PortDuplexStream(port)

const inpageStream = new WindowPostMessageStream(
    {
        name:CONSTEN_WINDOW_STREAM_NAME,
        target:INPAGE_WINDOW_STREAM_NAME,
    }
)

pipeline(portStream,inpageStream ,(err) =>{ console.error("from portStram to inpage stream",err)})
pipeline(inpageStream,portStream ,(err) =>{ console.error("from inpage stream portStram ",err)})





