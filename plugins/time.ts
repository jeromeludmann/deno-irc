import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp, { createCtcp } from "./ctcp.ts";

export interface CtcpTimeEventParams {
  /** Target of the CTCP TIME query. */
  target: string;
}

export type CtcpTimeEvent = Message<CtcpTimeEventParams>;

export interface CtcpTimeReplyEventParams {
  /** Date time of the user. */
  time: string;
}

export type CtcpTimeReplyEvent = Message<CtcpTimeReplyEventParams>;

interface TimeFeatures {
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
    "ctcp_time": CtcpTimeEvent;
    "ctcp_time_reply": CtcpTimeReplyEvent;
  };
}

const DEFAULT_TIME_REPLY = true;

export default createPlugin("time", [ctcp])<TimeFeatures>((client, options) => {
  const replyEnabled = options.ctcpReplies?.time ?? DEFAULT_TIME_REPLY;

  // Sends TIME or CTCP TIME command.
  client.time = (target) => {
    if (target === undefined) {
      client.send("TIME");
    } else {
      client.ctcp(target, "TIME");
    }
  };

  // Emits 'ctcp_time' and 'ctcp_time_reply' events.
  client.on("ctcp", (msg) => {
    if (msg.command === "TIME") {
      const { source, params: { type, target, param: time } } = msg;

      switch (type) {
        case "query":
          client.emit("ctcp_time", { source, params: { target } });
          break;
        case "reply":
          if (time !== undefined) {
            client.emit("ctcp_time_reply", { source, params: { time } });
          }
          break;
      }
    }
  });

  // Replies to CTCP TIME.
  if (!replyEnabled) return;
  client.on("ctcp_time", (msg) => {
    const { source } = msg;
    if (source) {
      const time = new Date().toLocaleString();
      const ctcp = createCtcp("TIME", time);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
