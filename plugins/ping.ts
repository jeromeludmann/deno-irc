import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpPluginParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface Options {
  replies?: {
    ping?: boolean;
  };
}

export interface Commands {
  ping(target?: string): void;
}

export interface Events {
  "ping": Ping;
  "pong": Pong;
  "ctcp_ping": CtcpPing;
  "ctcp_ping_reply": CtcpPing;
}

export interface Ping {
  keys: string[];
}

export interface Pong {
  origin: string;
  daemon: string;
  key: string;
}

export interface CtcpPing {
  origin: UserMask;
  target: string;
  key: string;
}

export interface PingPluginParams {
  options: Options;
  commands: Commands;
  events: Events;
}

function options(client: ExtendedClient<PingPluginParams>) {
  client.options.replies ??= {};
  client.options.replies.ping ??= true;
}

function commands(client: ExtendedClient<PingPluginParams & CtcpPluginParams>) {
  client.ping = (target) => {
    const key = Date.now().toString();

    if (target) {
      client.ctcp(target, "PING", key);
    } else {
      client.send("PING", key);
    }
  };
}

function events(client: ExtendedClient<PingPluginParams & CtcpPluginParams>) {
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

function replies(client: ExtendedClient<PingPluginParams>) {
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

export const plugin = createPlugin(
  options,
  commands,
  events,
  replies,
);
