import type { ExtendedClient, UserMask } from "../core/mod.ts";
import {
  createPlugin,
  isChannel,
  isServerHost,
  parseUserMask,
} from "../core/mod.ts";
import { isCtcp } from "./ctcp.ts";

export interface Commands {
  notice(target: string, text: string): void;
}

export interface Events {
  "notice": Notice;
  "notice:server": ServerNotice;
  "notice:channel": ChannelNotice;
  "notice:private": PrivateNotice;
}

export interface Notice {
  prefix: string;
  target: string;
  text: string;
}

export interface ServerNotice {
  origin: string;
  text: string;
}

export interface ChannelNotice {
  origin: UserMask;
  channel: string;
  text: string;
}

export interface PrivateNotice {
  origin: UserMask;
  text: string;
}

export interface NoticePluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<NoticePluginParams>) {
  client.notice = client.send.bind(client, "NOTICE");
}

function events(client: ExtendedClient<NoticePluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "NOTICE") {
      return;
    }

    if (isCtcp(msg)) {
      return;
    }

    const [target, text] = msg.params;

    client.emit("notice", {
      prefix: msg.prefix,
      target,
      text,
    });

    if (isServerHost(msg.prefix)) {
      return client.emit("notice:server", {
        origin: msg.prefix,
        text,
      });
    }

    const origin = parseUserMask(msg.prefix);

    if (isChannel(target)) {
      client.emit("notice:channel", {
        origin,
        channel: target,
        text,
      });
    } else {
      client.emit("notice:private", {
        origin,
        text,
      });
    }
  });
}

export const plugin = createPlugin(commands, events);
