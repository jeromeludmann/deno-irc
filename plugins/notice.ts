import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { isChannel } from "../core/strings.ts";
import { isCtcp } from "./ctcp.ts";

export interface NoticeEventParams {
  /** Target of the NOTICE.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Text of the NOTICE. */
  text: string;
}

export type NoticeEvent = Message<NoticeEventParams>;

interface NoticeFeatures {
  commands: {
    /** Notifies a `target` with a `text`. */
    notice(target: string, text: string): void;
  };
  events: {
    "notice": NoticeEvent;
    "notice:channel": NoticeEvent;
    "notice:private": NoticeEvent;
  };
}

export default createPlugin("notice")<NoticeFeatures>((client) => {
  // Sends NOTICE command.

  client.notice = (target, text) => {
    client.send("NOTICE", target, text);
  };

  // Emits 'notice' event.

  client.on("raw:notice", (msg) => {
    if (isCtcp(msg)) return;

    const { source, params: [target, text] } = msg;
    const payload: NoticeEvent = { source, params: { target, text } };

    client.emit("notice", payload);

    const event = `notice:${
      isChannel(target) ? "channel" : "private"
    }` as const;

    client.emit(event, payload);
  });
});
