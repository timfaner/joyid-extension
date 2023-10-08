import { connectCallback } from "@joyid/evm";
import generateUniqueId from "generate-unique-id";
import { Duplex } from "stream";

export class StreamPool {
  portStreamList = new Map<string, Duplex>();
  declare on_data_cb: (data: any, stream_id: string) => void;

  constructor(on_data_cb: (data: any, stream_id: string) => void) {
    this.on_data_cb = on_data_cb;
  }

  registPortStream(portStream: Duplex): void {
    let portStreamID = generateUniqueId();
    this.portStreamList.set(portStreamID, portStream);

    portStream.on("data", this.onData(portStreamID));
    portStream.on("close", this.onClose(portStreamID));
    portStream.on("error", this.onError(portStreamID));

    portStream.write(`background connected, your id is ${portStreamID}`);
    console.debug(`Connect id is ${portStreamID}`);
  }

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

  onData(portStreamID: string) {
    return (data: any) => {
      console.debug("ondata", portStreamID);
      this.on_data_cb(data, portStreamID);
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