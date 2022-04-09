import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";

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
      /** Replies to CTCP TIME.
       *
       * Default to `true`. */
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
  // Sends TIME or CTCP TIME command.

  client.time = (target) => {
    if (target === undefined) {
      client.send("TIME");
    } else {
      client.ctcp(target, "TIME");
    }
  };

  // Emits 'ctcp_time' and 'ctcp_time_reply' events.

  client.on("raw_ctcp:time", (msg) => {
    const { source, params: { target } } = msg;
    client.emit("ctcp_time", { source, params: { target } });
  });

  client.on("raw_ctcp:time_reply", (msg) => {
    const { source, params: { arg: time } } = msg;
    client.emit("ctcp_time_reply", { source, params: { time } });
  });

  // Replies to CTCP TIME.

  const replyEnabled = options.ctcpReplies?.time ?? DEFAULT_TIME_REPLY;
  if (!replyEnabled) return;

  client.on("ctcp_time", (msg) => {
    const { source } = msg;
    if (source) {
      const time = new Date().toLocaleString();
      const ctcp = client.utils.createCtcp("TIME", time);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
