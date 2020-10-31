import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { AnyCtcpCommand, CtcpParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

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

function options(client: ExtendedClient<ClientinfoParams>) {
  client.options.ctcpReplies ??= {};
  client.options.ctcpReplies.clientinfo ??= true;
}

function commands(
  client: ExtendedClient<ClientinfoParams & CtcpParams>,
) {
  client.clientinfo = (target) => {
    client.ctcp(target, "CLIENTINFO");
  };
}

function events(
  client: ExtendedClient<ClientinfoParams & CtcpParams>,
) {
  client.on("raw:ctcp", (msg) => {
    if (msg.command !== "CLIENTINFO") {
      return;
    }

    const { origin, target, param } = msg;

    switch (msg.type) {
      case "query":
        client.emit("ctcp_clientinfo", {
          origin,
          target,
        });
        break;

      case "reply":
        const supported = (param?.split(" ") ?? []) as AnyCtcpCommand[];
        client.emit("ctcp_clientinfo_reply", {
          origin,
          target,
          supported,
        });
        break;
    }
  });
}

function replies(client: ExtendedClient<ClientinfoParams>) {
  if (client.options.ctcpReplies?.clientinfo === false) {
    return;
  }

  client.on("ctcp_clientinfo", (msg) => {
    client.send(
      "NOTICE",
      msg.origin.nick,
      createCtcp("CLIENTINFO", "PING TIME VERSION"),
    );
  });
}

export const clientinfo = createPlugin(options, commands, events, replies);
