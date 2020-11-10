import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpParams } from "./ctcp.ts";
import { createCtcp } from "./ctcp.ts";

export interface VersionParams {
  options: {
    ctcpReplies?: {
      /**
       * Replies to CTCP VERSION with the given string.
       *
       * Default to `"deno-irc"`. `false` to disable.
       */
      version?: string | false;
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
  client.options.ctcpReplies ??= {};
  client.options.ctcpReplies.version ??= "deno-irc";
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
  const version = client.options.ctcpReplies?.version;

  if (!version) {
    return;
  }

  client.on("ctcp_version", (msg) => {
    client.send("NOTICE", msg.origin.nick, createCtcp("VERSION", version));
  });
}

export const version = createPlugin(
  options,
  commands,
  events,
  replies,
);
