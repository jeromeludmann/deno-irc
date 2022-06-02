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
  supported: Uppercase<AnyCtcpCommand>[];
}

export type CtcpClientinfoReplyEvent = Message<CtcpClientinfoReplyEventParams>;

interface ClientinfoFeatures {
  options: {
    ctcpReplies?: {
      /** Replies to CTCP CLIENTINFO.
       *
       * Default to `true`. */
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

  client.on("raw_ctcp:clientinfo", (msg) => {
    const { source, params: { target } } = msg;
    client.emit("ctcp_clientinfo", { source, params: { target } });
  });

  client.on("raw_ctcp:clientinfo_reply", (msg) => {
    const { source, params: { arg } } = msg;
    const supported = (arg?.split(" ") ?? []) as Uppercase<AnyCtcpCommand>[];
    client.emit("ctcp_clientinfo_reply", { source, params: { supported } });
  });

  // Replies to CTCP CLIENTINFO.

  const replyEnabled = options.ctcpReplies?.clientinfo ?? REPLY_ENABLED;
  if (!replyEnabled) return;

  client.on("ctcp_clientinfo", (msg) => {
    const { source } = msg;

    if (source) {
      const param = SUPPORTED_COMMANDS.join(" ");
      const ctcp = client.utils.createCtcp("CLIENTINFO", param);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
