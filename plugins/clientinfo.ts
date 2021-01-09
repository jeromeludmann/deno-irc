import { Plugin } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { AnyCtcpCommand, createCtcp, Ctcp, CtcpParams } from "./ctcp.ts";

export interface ClientinfoParams {
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
    "ctcp_clientinfo": CtcpClientinfo;
    "ctcp_clientinfo_reply": CtcpClientinfoReply;
  };
}

export interface CtcpClientinfo {
  /** Origin of the CTCP CLIENTINFO query. */
  origin: UserMask;

  /** Target of the CTCP CLIENTINFO query. */
  target: string;
}

export interface CtcpClientinfoReply {
  /** User who sent the CTCP CLIENTINFO reply. */
  origin: UserMask;

  /** Target who received the CTCP CLIENTINFO reply. */
  target: string;

  /** Array of supported commands by the user. */
  supported: AnyCtcpCommand[];
}

const DEFAULT_CLIENTINFO_REPLY = true;

const supported = ["PING", "TIME", "VERSION"];

export const clientinfo: Plugin<
  & CtcpParams
  & ClientinfoParams
> = (client, options) => {
  const replyEnabled = options.ctcpReplies?.clientinfo ??
    DEFAULT_CLIENTINFO_REPLY;

  const sendClientinfo = (target: string) => {
    client.ctcp(target, "CLIENTINFO");
  };

  const emitClientinfo = (msg: Ctcp) => {
    if (msg.command !== "CLIENTINFO") {
      return;
    }

    const { origin, target, param } = msg;

    switch (msg.type) {
      case "query": {
        client.emit("ctcp_clientinfo", { origin, target });
        break;
      }
      case "reply": {
        const supported = (param?.split(" ") ?? []) as AnyCtcpCommand[];
        client.emit("ctcp_clientinfo_reply", { origin, target, supported });
        break;
      }
    }
  };

  client.clientinfo = sendClientinfo;
  client.on("ctcp", emitClientinfo);

  if (!replyEnabled) {
    return;
  }

  const replyToClientinfo = (msg: CtcpClientinfo) => {
    const param = supported.join(" ");
    const ctcp = createCtcp("CLIENTINFO", param);
    client.send("NOTICE", msg.origin.nick, ctcp);
  };

  client.on("ctcp_clientinfo", replyToClientinfo);
};
