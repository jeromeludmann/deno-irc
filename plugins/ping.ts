import { Plugin } from "../core/client.ts";
import { Raw, UserMask } from "../core/parsers.ts";
import { createCtcp, CtcpEvent, CtcpParams } from "./ctcp.ts";

export interface PingEvent {
  /** Keys of the PING. */
  keys: string[];
}

export interface PongEvent {
  /** Server that sent the PONG. */
  origin: string;

  /** Daemon of the PONG. */
  daemon: string;

  /** Key of the PONG. */
  key: string;
}

export interface CtcpPingEvent {
  /** User who sent the CTCP PING (query or reply). */
  origin: UserMask;

  /** Target who received the CTCP PING (query or reply). */
  target: string;

  /** Key of the CTCP PING (query or reply). */
  key: string;
}

export interface PingParams {
  options: {
    ctcpReplies?: {
      /** Replies to CTCP PING. */
      ping?: boolean;
    };
  };
  commands: {
    /** Pings a `target`. */
    ping(target?: string): void;
  };
  events: {
    "ping": PingEvent;
    "pong": PongEvent;
    "ctcp_ping": CtcpPingEvent;
    "ctcp_ping_reply": CtcpPingEvent;
  };
}

const DEFAULT_CTCP_PING_REPLY = true;

export const pingPlugin: Plugin<CtcpParams & PingParams> = (
  client,
  options,
) => {
  const ctcpReplyEnabled = options.ctcpReplies?.ping ?? DEFAULT_CTCP_PING_REPLY;

  const sendPing = (target?: string) => {
    const key = Date.now().toString();

    if (target === undefined) {
      client.send("PING", key);
    } else {
      client.ctcp(target, "PING", key);
    }
  };

  const emitPing = (msg: Raw) => {
    switch (msg.command) {
      case "PING": {
        const { params: keys } = msg;
        client.emit("ping", { keys });
        break;
      }
      case "PONG": {
        const { prefix: origin, params: [daemon, key] } = msg;
        client.emit("pong", { origin, daemon, key });
        break;
      }
    }
  };

  const emitCtcpPing = (msg: CtcpEvent) => {
    if (
      msg.command !== "PING" ||
      msg.param === undefined
    ) {
      return;
    }

    const { origin, target, param: key } = msg;

    switch (msg.type) {
      case "query":
        client.emit("ctcp_ping", { origin, target, key });
        break;

      case "reply":
        client.emit("ctcp_ping_reply", { origin, target, key });
        break;
    }
  };

  const replyToPing = (msg: PingEvent) => {
    client.send("PONG", ...msg.keys);
  };

  const replyToCtcpPing = (msg: CtcpPingEvent) => {
    const { origin: { nick }, key } = msg;
    const ctcp = createCtcp("PING", key);
    client.send("NOTICE", nick, ctcp);
  };

  client.ping = sendPing;
  client.on("raw", emitPing);
  client.on("ctcp", emitCtcpPing);
  client.on("ping", replyToPing);

  if (ctcpReplyEnabled) {
    client.on("ctcp_ping", replyToCtcpPing);
  }
};
