import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface PingParams {
  options: {
    replies?: {
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

function options(client: ExtendedClient<PingParams>) {
  client.options.replies ??= {};
  client.options.replies.ping ??= true;
}

function commands(client: ExtendedClient<PingParams & CtcpParams>) {
  client.ping = (target) => {
    const key = Date.now().toString();

    if (target) {
      client.ctcp(target, "PING", key);
    } else {
      client.send("PING", key);
    }
  };
}

function events(client: ExtendedClient<PingParams & CtcpParams>) {
  client.on("raw", (msg) => {
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
  });

  client.on("raw:ctcp", (msg) => {
    if (msg.command !== "PING") return;
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
  });
}

function replies(client: ExtendedClient<PingParams>) {
  const pong = (...keys: string[]) => {
    client.send("PONG", ...keys);
  };

  client.on("ping", (msg) => {
    pong(...msg.keys);
  });

  if (client.options.replies?.ping) {
    client.on("ctcp_ping", (msg) => {
      client.send("NOTICE", msg.origin.nick, createCtcp("PING", msg.key));
    });
  }
}

export const ping = createPlugin(
  options,
  commands,
  events,
  replies,
);
