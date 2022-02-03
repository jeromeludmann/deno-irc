import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";

export interface PingEventParams {
  /** Keys of the PING. */
  keys: string[];
}

export type PingEvent = Message<PingEventParams>;

export interface PongEventParams {
  /** Daemon of the PONG. */
  daemon: string;

  /** Key of the PONG. */
  key: string;
}

export type PongEvent = Message<PongEventParams>;

export interface CtcpPingEventParams {
  /** Target of the CTCP PING query.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Key of the CTCP PING query. */
  key: string;
}

export type CtcpPingEvent = Message<CtcpPingEventParams>;

export interface CtcpPingReplyEventParams {
  /** Key of the CTCP PING reply. */
  key: string;
}

export type CtcpPingReplyEvent = Message<CtcpPingReplyEventParams>;

interface PingFeatures {
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
    "ctcp_ping_reply": CtcpPingReplyEvent;
  };
}

const CTCP_REPLY_ENABLED = true;

export default createPlugin("ping", [ctcp])<PingFeatures>((client, options) => {
  const ctcpReplyEnabled = options.ctcpReplies?.ping ?? CTCP_REPLY_ENABLED;

  // Sends PING command.

  client.ping = (target) => {
    const key = Date.now().toString();

    if (target === undefined) {
      client.send("PING", key);
    } else {
      client.ctcp(target, "PING", key);
    }
  };

  // Emits 'ping' and 'pong' events.

  client.on("raw:ping", (msg) => {
    const { source, params: keys } = msg;
    client.emit("ping", { source, params: { keys } });
  });

  client.on("raw:pong", (msg) => {
    const { source, params: [daemon, key] } = msg;
    client.emit("pong", { source, params: { daemon, key } });
  });

  // Emits 'ctcp_ping' event.

  client.on("ctcp", (msg) => {
    if (
      msg.command === "PING" &&
      msg.params.param !== undefined
    ) {
      const { source, params: { type, target, param: key } } = msg;

      switch (type) {
        case "query":
          client.emit("ctcp_ping", { source, params: { target, key } });
          break;
        case "reply":
          client.emit("ctcp_ping_reply", { source, params: { key } });
          break;
      }
    }
  });

  // Replies to PING.

  client.on("ping", (msg) => {
    client.send("PONG", ...msg.params.keys);
  });

  // Replies to CTCP PING.

  if (!ctcpReplyEnabled) return;
  client.on("ctcp_ping", (msg) => {
    const { source, params: { key } } = msg;
    if (source) {
      const ctcp = client.utils.createCtcp("PING", key);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
