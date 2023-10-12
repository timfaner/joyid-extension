import generateUniqueId from "generate-unique-id";
import { Duplex } from "stream";

export class StreamPool {
    portStreamList = new Map<string, Duplex>();
    declare on_data_cb: (
        data: any,
        stream_id: string,
        that: StreamPool,
    ) => void;

    constructor(
        on_data_cb: (data: any, stream_id: string, that: StreamPool) => void,
    ) {
        // on data 的回调函数
        this.on_data_cb = on_data_cb;
    }

    registPortStream(portStream: Duplex): void {
        let portStreamID = generateUniqueId();
        this.portStreamList.set(portStreamID, portStream);

        portStream.on("data", this.onData(portStreamID));
        portStream.on("close", this.onClose(portStreamID));
        portStream.on("error", this.onError(portStreamID));

        console.debug(`Connect id is ${portStreamID}`);
    }

    //广播发送data到所有已注册stream
    broadcastSend(data: any): void {
        this.portStreamList.forEach((stream, key) => {
            console.debug(`${key} is sending ${data}`);
            stream.write(data, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        });
    }

    //向特定id的stream发送data
    send(stream_id: string, data: any): void {
        this.portStreamList.get(stream_id)?.write(data);
    }

    onData(portStreamID: string) {
        return (data: any) => {
            console.debug("ondata", portStreamID);
            this.on_data_cb(data, portStreamID, this);
        };
    }

    onClose(portStreamID: string) {
        return () => {
            console.debug(`portstream ${portStreamID} closed`);
            this.portStreamList.delete(portStreamID);
        };
    }

    onError(portStreamID: string) {
        return (err: Error) => {
            console.error(err, portStreamID);
        };
    }
}
