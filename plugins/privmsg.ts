import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { isCtcp } from "./ctcp.ts";
import chantypes from "./chantypes.ts";

export interface PrivmsgEventParams {
  /** Target of the PRIVMSG.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Text of the PRIVMSG. */
  text: string;
}

export type PrivmsgEvent = Message<PrivmsgEventParams>;

interface PrivmsgFeatures {
  commands: {
    /** Sends a message `text` to a `target`. */
    privmsg(target: string, text: string): void;

    /** Sends a message `text` to a `target`. */
    msg: PrivmsgFeatures["commands"]["privmsg"];
  };
  events: {
    "privmsg": PrivmsgEvent;
    "privmsg:channel": PrivmsgEvent;
    "privmsg:private": PrivmsgEvent;
  };
}

export default createPlugin(
  "privmsg",
  [chantypes],
)<PrivmsgFeatures>((client) => {
  // Sends PRIVMSG command.

  client.privmsg = client.msg = (target, text) => {
    client.send("PRIVMSG", target, text);
  };

  // Emits 'privmsg' event.

  client.on("raw:privmsg", (msg) => {
    if (isCtcp(msg)) return;

    const { source, params: [target, text] } = msg;
    const payload: PrivmsgEvent = { source, params: { target, text } };

    client.emit("privmsg", payload);

    const targetType = client.utils.isChannel(target) ? "channel" : "private";
    const event = `privmsg:${targetType}` as const;

    client.emit(event, payload);
  });
});
