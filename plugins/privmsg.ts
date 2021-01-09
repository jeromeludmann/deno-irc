import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";
import { isChannel, isNick } from "../core/strings.ts";
import { isCtcp } from "./ctcp.ts";

export interface PrivmsgParams {
  commands: {
    /** Sends a message `text` to a `target`. */
    privmsg(target: string, text: string): void;

    /** Sends a message `text` to a `target`. */
    msg: PrivmsgParams["commands"]["privmsg"];
  };

  events: {
    "privmsg": Privmsg;
    "privmsg:channel": ChannelPrivmsg;
    "privmsg:private": PrivatePrivmsg;
  };
}

export interface Privmsg {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Target who received the PRIVMSG. */
  target: string;

  /** Text of the PRIVMSG. */
  text: string;
}

export interface ChannelPrivmsg {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Channel where the PRIVMSG is sent. */
  channel: string;

  /** Text of the PRIVMSG. */
  text: string;
}

export interface PrivatePrivmsg {
  /** User who sent the PRIVMSG. */
  origin: UserMask;

  /** Text of the PRIVMSG. */
  text: string;
}

export const privmsg: Plugin<PrivmsgParams> = (client) => {
  client.privmsg = sendPrivmsg;
  client.msg = sendPrivmsg;
  client.on("raw", emitPrivmsg);
  client.on("privmsg", emitChannelPrivmsg);
  client.on("privmsg", emitPrivatePrivmsg);

  function sendPrivmsg(...params: string[]) {
    client.send("PRIVMSG", ...params);
  }

  function emitPrivmsg(msg: Raw) {
    if (
      msg.command !== "PRIVMSG" ||
      isCtcp(msg)
    ) {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [target, text] = msg.params;

    client.emit("privmsg", {
      origin,
      target,
      text,
    });
  }

  function emitChannelPrivmsg(msg: Privmsg) {
    if (!isChannel(msg.target)) {
      return;
    }

    const { origin, target, text } = msg;

    client.emit("privmsg:channel", {
      origin,
      channel: target,
      text,
    });
  }

  function emitPrivatePrivmsg(msg: Privmsg) {
    if (!isNick(msg.target)) {
      return;
    }

    const { origin, text } = msg;

    client.emit("privmsg:private", {
      origin,
      text,
    });
  }
};
