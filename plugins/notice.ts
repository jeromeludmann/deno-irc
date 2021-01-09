import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";
import {
  isChannel,
  isNick,
  isServerHost,
  isUserMask,
} from "../core/strings.ts";
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

export const notice: Plugin<NoticeParams> = (client) => {
  client.notice = sendNotice;
  client.on("raw", emitNotice);
  client.on("notice", emitServerNotice);
  client.on("notice", emitChannelNotice);
  client.on("notice", emitPrivateNotice);

  function sendNotice(...params: string[]) {
    client.send("NOTICE", ...params);
  }

  function emitNotice(msg: Raw) {
    if (
      msg.command !== "NOTICE" ||
      isCtcp(msg)
    ) {
      return;
    }

    const [target, text] = msg.params;

    client.emit("notice", {
      prefix: msg.prefix,
      target,
      text,
    });
  }

  function emitServerNotice(msg: Notice) {
    if (!isServerHost(msg.prefix)) {
      return;
    }

    return client.emit("notice:server", {
      origin: msg.prefix,
      text: msg.text,
    });
  }

  function emitChannelNotice(msg: Notice) {
    if (
      !isUserMask(msg.prefix) ||
      !isChannel(msg.target)
    ) {
      return;
    }

    const origin = parseUserMask(msg.prefix);

    client.emit("notice:channel", {
      origin,
      channel: msg.target,
      text: msg.text,
    });
  }

  function emitPrivateNotice(msg: Notice) {
    if (
      !isUserMask(msg.prefix) ||
      !isNick(msg.target)
    ) {
      return;
    }

    const origin = parseUserMask(msg.prefix);

    client.emit("notice:private", {
      origin,
      text: msg.text,
    });
  }
};
