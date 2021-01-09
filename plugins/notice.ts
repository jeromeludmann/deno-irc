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
  const sendNotice = (...params: string[]) => {
    client.send("NOTICE", ...params);
  };

  const emitNotice = (msg: Raw) => {
    if (
      msg.command !== "NOTICE" ||
      isCtcp(msg)
    ) {
      return;
    }

    const { prefix, params: [target, text] } = msg;
    client.emit("notice", { prefix, target, text });
  };

  const emitServerNotice = (msg: Notice) => {
    if (!isServerHost(msg.prefix)) {
      return;
    }

    const { prefix: origin, text } = msg;
    client.emit("notice:server", { origin, text });
  };

  const emitChannelNotice = (msg: Notice) => {
    if (
      !isUserMask(msg.prefix) ||
      !isChannel(msg.target)
    ) {
      return;
    }

    const { prefix, target: channel, text } = msg;
    const origin = parseUserMask(prefix);

    client.emit("notice:channel", { origin, channel, text });
  };

  const emitPrivateNotice = (msg: Notice) => {
    if (
      !isUserMask(msg.prefix) ||
      !isNick(msg.target)
    ) {
      return;
    }

    const { prefix, text } = msg;
    const origin = parseUserMask(prefix);

    client.emit("notice:private", { origin, text });
  };

  client.notice = sendNotice;
  client.on("raw", emitNotice);
  client.on("notice", emitServerNotice);
  client.on("notice", emitChannelNotice);
  client.on("notice", emitPrivateNotice);
};
