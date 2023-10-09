import { WindowPostMessageStream } from "@metamask/post-message-stream";
import {
    CONSTEN_WINDOW_STREAM_NAME,
    INPAGE_WINDOW_STREAM_NAME,
} from "./constant";

export function getInpageStream() {
    return new WindowPostMessageStream({
        name: INPAGE_WINDOW_STREAM_NAME,
        target: CONSTEN_WINDOW_STREAM_NAME,
    });
}
