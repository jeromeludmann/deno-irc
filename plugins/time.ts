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

const DEFAULT_TIME_REPLY = true;

export const time: Plugin<CtcpParams & TimeParams> = (client, options) => {
  const replyEnabled = options.ctcpReplies?.time ?? DEFAULT_TIME_REPLY;

  const sendTime = (target?: string) => {
    if (target === undefined) {
      client.send("TIME");
    } else {
      client.ctcp(target, "TIME");
    }
  };

  const emitCtcpTime = (msg: Ctcp) => {
    if (msg.command !== "TIME") {
      return;
    }

    const { origin, target, param: time } = msg;

    switch (msg.type) {
      case "query":
        client.emit("ctcp_time", { origin, target });
        break;

      case "reply":
        if (time === undefined) break;
        client.emit("ctcp_time_reply", { origin, target, time });
        break;
    }
  };

  client.time = sendTime;
  client.on("ctcp", emitCtcpTime);

  if (!replyEnabled) {
    return;
  }

  const replyToCtcpTime = (msg: CtcpTime) => {
    const time = new Date().toLocaleString();
    const ctcp = createCtcp("TIME", time);
    client.send("NOTICE", msg.origin.nick, ctcp);
  };

  client.on("ctcp_time", replyToCtcpTime);
};
