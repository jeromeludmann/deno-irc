import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { AnyCtcpCommand, CtcpPluginParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface Options {
  replies?: {
    /** Replies to CTCP CLIENTINFO. */
    clientinfo?: boolean;
  };
}

export interface Commands {
  /** Queries the supported CTCP commands of a `target`. */
  clientinfo(target: string): void;
}

export interface Events {
  "ctcp_clientinfo": CtcpClientinfo;
  "ctcp_clientinfo_reply": CtcpClientinfoReply;
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

export interface ClientinfoPluginParams {
  commands: Commands;
  events: Events;
  options: Options;
}

function options(client: ExtendedClient<ClientinfoPluginParams>) {
  client.options.replies ??= {};
  client.options.replies.clientinfo ??= true;
}

function commands(
  client: ExtendedClient<ClientinfoPluginParams & CtcpPluginParams>,
) {
  client.clientinfo = (target) => {
    client.ctcp(target, "CLIENTINFO");
  };
}

function events(
  client: ExtendedClient<ClientinfoPluginParams & CtcpPluginParams>,
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

function replies(client: ExtendedClient<ClientinfoPluginParams>) {
  if (client.options.replies?.clientinfo === false) {
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

export const plugin = createPlugin(options, commands, events, replies);
