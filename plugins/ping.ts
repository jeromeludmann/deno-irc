import { Plugin } from "../core/client.ts";
import { Raw, UserMask } from "../core/parsers.ts";
import { createCtcp, Ctcp, CtcpParams } from "./ctcp.ts";

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
    "ping": Ping;
    "pong": Pong;
    "ctcp_ping": CtcpPing;
    "ctcp_ping_reply": CtcpPing;
  };
}

export interface Ping {
  /** Keys of the PING. */
  keys: string[];
}

export interface Pong {
  /** Server that sent the PONG. */
  origin: string;

  /** Daemon of the PONG. */
  daemon: string;

  /** Key of the PONG. */
  key: string;
}

export interface CtcpPing {
  /** User who sent the CTCP PING (query or reply). */
  origin: UserMask;

  /** Target who received the CTCP PING (query or reply). */
  target: string;

  /** Key of the CTCP PING (query or reply). */
  key: string;
}

export const ping: Plugin<CtcpParams & PingParams> = (client, options) => {
  const ctcpPingReplyEnabled = options.ctcpReplies?.ping ?? true;

  client.ping = sendPing;
  client.on("raw", emitPing);
  client.on("ctcp", emitCtcpPing);
  client.on("ping", replyToPing);

  if (ctcpPingReplyEnabled) {
    client.on("ctcp_ping", replyToCtcpPing);
  }

  function sendPing(target?: string) {
    const key = Date.now().toString();

    if (target === undefined) {
      client.send("PING", key);
    } else {
      client.ctcp(target, "PING", key);
    }
  }

  function sendPong(...params: string[]) {
    client.send("PONG", ...params);
  }

  function emitPing(msg: Raw) {
    switch (msg.command) {
      case "PING":
        return client.emit("ping", {
          keys: msg.params,
        });

      case "PONG":
        const [daemon, key] = msg.params;
        return client.emit("pong", {
          origin: msg.prefix,
          daemon,
          key,
        });
    }
  }

  function emitCtcpPing(msg: Ctcp) {
    if (msg.command !== "PING") {
      return;
    }

    const { origin, target } = msg;

    switch (msg.type) {
      case "query":
        return client.emit("ctcp_ping", {
          origin,
          target,
          key: msg.param!,
        });

      case "reply":
        return client.emit("ctcp_ping_reply", {
          origin,
          target,
          key: msg.param!,
        });
    }
  }

  function replyToPing(msg: Ping) {
    sendPong(...msg.keys);
  }

  function replyToCtcpPing(msg: CtcpPing) {
    client.send("NOTICE", msg.origin.nick, createCtcp("PING", msg.key));
  }
};
