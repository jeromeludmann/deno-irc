import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";
import { isChannel, isNick } from "../core/strings.ts";
import { isCtcp } from "./ctcp.ts";

export interface PrivmsgEvent {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Target who received the PRIVMSG. */
  target: string;

  /** Text of the PRIVMSG. */
  text: string;
}

export interface ChannelPrivmsgEvent {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Channel where the PRIVMSG is sent. */
  channel: string;

  /** Text of the PRIVMSG. */
  text: string;
}

export interface PrivatePrivmsgEvent {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Text of the PRIVMSG. */
  text: string;
}

export interface PrivmsgParams {
  commands: {
    /** Sends a message `text` to a `target`. */
    privmsg(target: string, text: string): void;

    /** Sends a message `text` to a `target`. */
    msg: PrivmsgParams["commands"]["privmsg"];
  };
  events: {
    "privmsg": PrivmsgEvent;
    "privmsg:channel": ChannelPrivmsgEvent;
    "privmsg:private": PrivatePrivmsgEvent;
  };
}

export const privmsgPlugin: Plugin<PrivmsgParams> = (client) => {
  const sendPrivmsg = (...params: string[]) => {
    client.send("PRIVMSG", ...params);
  };

  const emitPrivmsg = (msg: Raw) => {
    if (
      msg.command !== "PRIVMSG" ||
      isCtcp(msg)
    ) {
      return;
    }

    const { prefix, params: [target, text] } = msg;
    const origin = parseUserMask(prefix);

    client.emit("privmsg", { origin, target, text });
  };

  const emitChannelPrivmsg = (msg: PrivmsgEvent) => {
    if (!isChannel(msg.target)) {
      return;
    }

    const { origin, target: channel, text } = msg;
    client.emit("privmsg:channel", { origin, channel, text });
  };

  const emitPrivatePrivmsg = (msg: PrivmsgEvent) => {
    if (!isNick(msg.target)) {
      return;
    }

    const { origin, text } = msg;
    client.emit("privmsg:private", { origin, text });
  };

  client.privmsg = sendPrivmsg;
  client.msg = sendPrivmsg;
  client.on("raw", emitPrivmsg);
  client.on("privmsg", emitChannelPrivmsg);
  client.on("privmsg", emitPrivatePrivmsg);
};
