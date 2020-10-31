import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface VersionParams {
  options: {
    replies?: {
      /** Replies to CTCP VERSION. */
      version?: boolean;
    };
  };
  commands: {
    /** Queries the client version of a `target`. */
    version(target?: string): void;
  };
  events: {
    "ctcp_version": CtcpVersion;
    "ctcp_version_reply": CtcpVersionReply;
  };
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

function options(client: ExtendedClient<VersionParams>) {
  client.options.replies ??= {};
  client.options.replies.version ??= true;
}

function commands(
  client: ExtendedClient<VersionParams & CtcpParams>,
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
  client: ExtendedClient<VersionParams & CtcpParams>,
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

function replies(client: ExtendedClient<VersionParams>) {
  if (!client.options.replies?.version) {
    return;
  }

  client.on("ctcp_version", (msg) => {
    client.send("NOTICE", msg.origin.nick, createCtcp("VERSION", "deno-irc"));
  });
}

export const version = createPlugin(
  options,
  commands,
  events,
  replies,
);
