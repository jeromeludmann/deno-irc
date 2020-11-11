import { createPlugin, ExtendedClient } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { createCtcp, CtcpParams } from "./ctcp.ts";

export interface TimeParams {
  options: {
    ctcpReplies?: {
      /** Replies to CTCP TIME. */
      time?: boolean;
    };
  };
  commands: {
    /** Queries the date time of a `target`. */
    time(target?: string): void;
  };
  events: {
    "ctcp_time": CtcpTime;
    "ctcp_time_reply": CtcpTimeReply;
  };
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

function options(client: ExtendedClient<TimeParams>) {
  client.options.ctcpReplies ??= {};
  client.options.ctcpReplies.time ??= true;
}

function commands(client: ExtendedClient<TimeParams & CtcpParams>) {
  client.time = (target) => {
    if (target === undefined) {
      client.send("TIME");
    } else {
      client.ctcp(target, "TIME");
    }
  };
}

function events(client: ExtendedClient<TimeParams & CtcpParams>) {
  client.on("ctcp", (msg) => {
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

function replies(client: ExtendedClient<TimeParams>) {
  if (!client.options.ctcpReplies?.time) {
    return;
  }

  client.on("ctcp_time", (msg) => {
    const time = new Date().toLocaleString();
    client.send("NOTICE", msg.origin.nick, createCtcp("TIME", time));
  });
}

export const time = createPlugin(
  options,
  commands,
  events,
  replies,
);
