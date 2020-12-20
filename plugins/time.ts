import { Plugin } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { createCtcp, Ctcp, CtcpParams } from "./ctcp.ts";

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

const DEFAULT_REPLY = true;

export const time: Plugin<CtcpParams & TimeParams> = (client, options) => {
  const reply = options.ctcpReplies?.time ?? DEFAULT_REPLY;

  client.time = sendTime;
  client.on("ctcp", emitCtcpTime);

  if (reply) {
    client.on("ctcp_time", replyToCtcpTime);
  }

  function sendTime(target?: string) {
    if (target === undefined) {
      client.send("TIME");
    } else {
      client.ctcp(target, "TIME");
    }
  }

  function emitCtcpTime(msg: Ctcp) {
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
  }

  function replyToCtcpTime(msg: CtcpTime) {
    const ctcpPayload = createCtcp("TIME", new Date().toLocaleString());
    client.send("NOTICE", msg.origin.nick, ctcpPayload);
  }
};
