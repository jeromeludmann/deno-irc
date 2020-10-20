import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpPluginParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface Options {
  replies?: {
    /** Replies to CTCP VERSION. */
    version?: boolean;
  };
}

export interface Commands {
  /** Queries the client version of a `target`. */
  version(target?: string): void;
}

export interface Events {
  "ctcp_version": CtcpVersion;
  "ctcp_version_reply": CtcpVersionReply;
}

export interface CtcpVersion {
  /** User who sent the CTCP VERSION query. */
  origin: UserMask;
  /** Target who received the CTCP VERSION query. */
  target: string;
}

export interface CtcpVersionReply {
  /** User who sent the CTCP VERSION reply. */
  origin: UserMask;
  /** Target who received the CTCP VERSION reply. */
  target: string;
  /** Client version of the user. */
  version: string;
}

export interface VersionPluginParams {
  options: Options;
  commands: Commands;
  events: Events;
}

function options(client: ExtendedClient<VersionPluginParams>) {
  client.options.replies ??= {};
  client.options.replies.version ??= true;
}

function commands(
  client: ExtendedClient<VersionPluginParams & CtcpPluginParams>,
) {
  client.version = (target) => {
    if (target !== undefined) {
      client.ctcp(target, "VERSION");
    } else {
      client.send("VERSION");
    }
  };
}

function events(
  client: ExtendedClient<VersionPluginParams & CtcpPluginParams>,
) {
  client.on("raw:ctcp", (msg) => {
    if (msg.command !== "VERSION") {
      return;
    }

    const { origin, target, param } = msg;

    switch (msg.type) {
      case "query":
        return client.emit("ctcp_version", {
          origin,
          target,
        });

      case "reply":
        return client.emit("ctcp_version_reply", {
          origin,
          target,
          version: param!,
        });
    }
  });
}

function replies(client: ExtendedClient<VersionPluginParams>) {
  if (!client.options.replies?.version) {
    return;
  }

  client.on("ctcp_version", (msg) => {
    client.send("NOTICE", msg.origin.nick, createCtcp("VERSION", "deno-irc"));
  });
}

export const plugin = createPlugin(
  options,
  commands,
  events,
  replies,
);
