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

  /** Latency (in milliseconds). */
  latency: number;
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

  /** Latency (in milliseconds). */
  latency: number;
}

export type CtcpPingReplyEvent = Message<CtcpPingReplyEventParams>;

interface PingFeatures {
  options: {
    ctcpReplies?: {
      /** Replies to CTCP PING.
       *
       * Default to `true`. */
      ping?: boolean;
    };
  };
  commands: {
    /** Pings the server or a given client `target`.
     *
     * Pings the server:
     *
     * ```ts
     * client.ping();
     * ```
     *
     * Pings (CTCP) all clients from `"#channel"`:
     *
     * ```ts
     * client.ping("#channel");
     * ```
     *
     * Pings (CTCP) a client `"nick"`:
     *
     * ```ts
     * client.ping('nick');
     * ``` */
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

  const getLatency = (key: string): number => Date.now() - parseInt(key, 10);

  client.on("raw:ping", (msg) => {
    const { source, params: keys } = msg;
    client.emit("ping", { source, params: { keys } });
  });

  client.on("raw:pong", (msg) => {
    const { source, params: [daemon, key] } = msg;
    const latency = getLatency(key);
    client.emit("pong", { source, params: { daemon, key, latency } });
  });

  // Emits 'ctcp_ping' and 'ctcp_ping_reply' events.

  client.on("raw_ctcp:ping", (msg) => {
    const { source, params: { target, arg: key } } = msg;
    if (key !== undefined) {
      client.emit("ctcp_ping", { source, params: { target, key } });
    }
  });

  client.on("raw_ctcp:ping_reply", (msg) => {
    const { source, params: { arg: key } } = msg;
    const latency = getLatency(key);
    client.emit("ctcp_ping_reply", { source, params: { key, latency } });
  });

  // Replies to PING.

  client.on("ping", (msg) => {
    client.send("PONG", ...msg.params.keys);
  });

  // Replies to CTCP PING.

  const ctcpReplyEnabled = options.ctcpReplies?.ping ?? CTCP_REPLY_ENABLED;

  if (ctcpReplyEnabled) {
    client.on("ctcp_ping", (msg) => {
      const { source, params: { key } } = msg;
      if (source) {
        const ctcp = client.utils.createCtcp("PING", key);
        client.send("NOTICE", source.name, ctcp);
      }
    });
  }
});
