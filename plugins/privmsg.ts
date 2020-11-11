import { createPlugin, ExtendedClient } from "../core/client.ts";
import { isChannel } from "../core/helpers.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";
import { isCtcp } from "./ctcp.ts";

export interface PrivmsgParams {
  commands: {
    /** Sends a message `text` to a `target`. */
    privmsg(target: string, text: string): void;
    /** Sends a message `text` to a `target`. */
    msg(target: string, text: string): void;
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

function commands(client: ExtendedClient<PrivmsgParams>) {
  client.privmsg = client.msg = (...params) =>
    client.send("PRIVMSG", ...params);
}

function events(client: ExtendedClient<PrivmsgParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "PRIVMSG") {
      return;
    }

    if (isCtcp(msg)) {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [target, text] = msg.params;

    client.emit("privmsg", {
      origin,
      target,
      text,
    });

    if (isChannel(target)) {
      client.emit("privmsg:channel", {
        origin,
        channel: target,
        text,
      });
    } else {
      client.emit("privmsg:private", {
        origin,
        text,
      });
    }
  });
}

export const privmsg = createPlugin(commands, events);
