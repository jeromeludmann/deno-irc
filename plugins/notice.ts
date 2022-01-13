import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";
import {
  isChannel,
  isNick,
  isServerHost,
  isUserMask,
} from "../core/strings.ts";
import { isCtcp } from "./ctcp.ts";

export interface NoticeEvent {
  /** Raw prefix of the NOTICE. */
  prefix: string;

  /** Target of the NOTICE. */
  target: string;

  /** Text of the NOTICE. */
  text: string;
}

export interface ServerNoticeEvent {
  /** Origin of the NOTICE. */
  origin: string;

  /** Text of the NOTICE. */
  text: string;
}

export interface ChannelNoticeEvent {
  /** User who sent the NOTICE. */
  origin: UserMask;

  /** Channel where the NOTICE is sent. */
  channel: string;

  /** Text of the NOTICE. */
  text: string;
}

export interface PrivateNoticeEvent {
  /** User who sent the NOTICE. */
  origin: UserMask;

  /** Text of the NOTICE. */
  text: string;
}

export interface NoticeParams {
  commands: {
    /** Notifies a `target` with a `text`. */
    notice(target: string, text: string): void;
  };
  events: {
    "notice": NoticeEvent;
    "notice:server": ServerNoticeEvent;
    "notice:channel": ChannelNoticeEvent;
    "notice:private": PrivateNoticeEvent;
  };
}

export const noticePlugin: Plugin<NoticeParams> = (client) => {
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

  const emitServerNotice = (msg: NoticeEvent) => {
    if (!isServerHost(msg.prefix)) {
      return;
    }

    const { prefix: origin, text } = msg;
    client.emit("notice:server", { origin, text });
  };

  const emitChannelNotice = (msg: NoticeEvent) => {
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

  const emitPrivateNotice = (msg: NoticeEvent) => {
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
