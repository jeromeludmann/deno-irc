import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpPluginParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface Options {
  replies?: {
    /** Replies to CTCP TIME. */
    time?: boolean;
  };
}

export interface Commands {
  /** Queries the date time of a `target`. */
  time(target?: string): void;
}

export interface Events {
  "ctcp_time": CtcpTime;
  "ctcp_time_reply": CtcpTimeReply;
}

export interface CtcpTime {
  /** User who sent the CTCP TIME query. */
  origin: UserMask;
  /** Target who received the CTCP TIME query. */
  target: string;
}

export interface CtcpTimeReply {
  /** User who sent the CTCP TIME reply. */
  origin: UserMask;
  /** Target who received the CTCP TIME reply. */
  target: string;
  /** Date time of the user. */
  time: string;
}

export interface TimePluginParams {
  options: Options;
  commands: Commands;
  events: Events;
}

function options(client: ExtendedClient<TimePluginParams>) {
  client.options.replies ??= {};
  client.options.replies.time ??= true;
}

function commands(client: ExtendedClient<TimePluginParams & CtcpPluginParams>) {
  client.time = (target) => {
    if (target !== undefined) {
      client.ctcp(target, "TIME");
    } else {
      client.send("TIME");
    }
  };
}

function events(client: ExtendedClient<TimePluginParams & CtcpPluginParams>) {
  client.on("raw:ctcp", (msg) => {
    if (msg.command !== "TIME") {
      return;
    }

    const { origin, target, param } = msg;

    switch (msg.type) {
      case "query":
        return client.emit("ctcp_time", {
          origin,
          target,
        });

      case "reply":
        return client.emit("ctcp_time_reply", {
          origin,
          target,
          time: param!,
        });
    }
  });
}

function replies(client: ExtendedClient<TimePluginParams>) {
  if (!client.options.replies?.time) {
    return;
  }

  client.on("ctcp_time", (msg) => {
    const time = new Date().toLocaleString();
    client.send("NOTICE", msg.origin.nick, createCtcp("TIME", time));
  });
}

export const plugin = createPlugin(
  options,
  commands,
  events,
  replies,
);
