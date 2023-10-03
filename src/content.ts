import PortDuplexStream from "extension-port-stream";

const port = chrome.runtime.connect({name: "knockknock"})
const s = new PortDuplexStream(port)

s.on("data",(data) => {
    console.log(data)
    s.write("echo" + data)
})


