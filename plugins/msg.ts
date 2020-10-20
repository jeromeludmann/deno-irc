import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, isChannel, parseUserMask } from "../core/mod.ts";
import { isCtcp } from "./ctcp.ts";

export interface Commands {
  msg(target: string, text: string): void;
}

export interface Events {
  "msg": Msg;
  "msg:channel": ChannelMsg;
  "msg:private": PrivateMsg;
}

export interface Msg {
  origin: UserMask;
  target: string;
  text: string;
}

export interface ChannelMsg {
  origin: UserMask;
  channel: string;
  text: string;
}

export interface PrivateMsg {
  origin: UserMask;
  text: string;
}

export interface MsgPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<MsgPluginParams>) {
  client.msg = client.send.bind(client, "PRIVMSG");
}

function events(client: ExtendedClient<MsgPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "PRIVMSG") {
      return;
    }

    if (isCtcp(msg)) {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [target, text] = msg.params;

    client.emit("msg", {
      origin,
      target,
      text,
    });

    if (isChannel(target)) {
      client.emit("msg:channel", {
        origin,
        channel: target,
        text,
      });
    } else {
      client.emit("msg:private", {
        origin,
        text,
      });
    }
  });
}

export const plugin = createPlugin(commands, events);
