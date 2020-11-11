import { createPlugin, ExtendedClient } from "../core/client.ts";
import { isChannel, isServerHost } from "../core/helpers.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";
import { isCtcp } from "./ctcp.ts";

export interface NoticeParams {
  commands: {
    /** Notifies a `target` with a `text`. */
    notice(target: string, text: string): void;
  };
  events: {
    "notice": Notice;
    "notice:server": ServerNotice;
    "notice:channel": ChannelNotice;
    "notice:private": PrivateNotice;
  };
}

export interface Notice {
  /** Raw prefix of the NOTICE. */
  prefix: string;
  /** Target of the NOTICE. */
  target: string;
  /** Text of the NOTICE. */
  text: string;
}

export interface ServerNotice {
  /** Origin of the NOTICE. */
  origin: string;
  /** Text of the NOTICE. */
  text: string;
}

export interface ChannelNotice {
  /** User who sent the NOTICE. */
  origin: UserMask;
  /** Channel where the NOTICE is sent. */
  channel: string;
  /** Text of the NOTICE. */
  text: string;
}

export interface PrivateNotice {
  /** User who sent the NOTICE. */
  origin: UserMask;
  /** Text of the NOTICE. */
  text: string;
}

function commands(client: ExtendedClient<NoticeParams>) {
  client.notice = (...params) => client.send("NOTICE", ...params);
}

function events(client: ExtendedClient<NoticeParams>) {
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

export const notice = createPlugin(commands, events);
