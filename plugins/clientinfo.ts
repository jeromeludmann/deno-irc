import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp, { type AnyCtcpCommand } from "./ctcp.ts";

export interface CtcpClientinfoEventParams {
  /** Target of the CTCP CLIENTINFO query. */
  target: string;
}

export type CtcpClientinfoEvent = Message<CtcpClientinfoEventParams>;

export interface CtcpClientinfoReplyEventParams {
  /** Array of supported commands by the user. */
  supported: AnyCtcpCommand[];
}

export type CtcpClientinfoReplyEvent = Message<CtcpClientinfoReplyEventParams>;

interface ClientinfoFeatures {
  options: {
    ctcpReplies?: {
      /** Replies to CTCP CLIENTINFO. */
      clientinfo?: boolean;
    };
  };
  commands: {
    /** Queries the supported CTCP commands of a `target`. */
    clientinfo(target: string): void;
  };
  events: {
    "ctcp_clientinfo": CtcpClientinfoEvent;
    "ctcp_clientinfo_reply": CtcpClientinfoReplyEvent;
  };
}

const REPLY_ENABLED = true;

const SUPPORTED_COMMANDS = ["PING", "TIME", "VERSION"];

export default createPlugin(
  "clientinfo",
  [ctcp],
)<ClientinfoFeatures>((client, options) => {
  // Sends CTCP CLIENTINFO command.
  client.clientinfo = (target) => {
    client.ctcp(target, "CLIENTINFO");
  };

  // Emits 'ctcp_clientinfo' and 'ctcp_clientinfo_reply' events.
  client.on("ctcp", (msg) => {
    if (msg.command !== "CLIENTINFO") return;
    const { source, params: { type, target, param } } = msg;

    switch (type) {
      case "query": {
        client.emit("ctcp_clientinfo", { source, params: { target } });
        break;
      }
      case "reply": {
        const supported = (param?.split(" ") ?? []) as AnyCtcpCommand[];
        client.emit("ctcp_clientinfo_reply", { source, params: { supported } });
        break;
      }
    }
  });

  const replyEnabled = options.ctcpReplies?.clientinfo ?? REPLY_ENABLED;
  if (!replyEnabled) return;

  // Replies to CTCP CLIENTINFO.
  client.on("ctcp_clientinfo", (msg) => {
    const { source } = msg;

    if (source) {
      const param = SUPPORTED_COMMANDS.join(" ");
      const ctcp = client.utils.createCtcp("CLIENTINFO", param);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
