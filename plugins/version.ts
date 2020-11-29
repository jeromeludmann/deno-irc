import { Plugin } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { createCtcp, Ctcp, CtcpParams } from "./ctcp.ts";

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

export const version: Plugin<
  & CtcpParams
  & VersionParams
> = (client, options) => {
  const replyEnabled = !!options.ctcpReplies?.version;
  const version = options.ctcpReplies?.version || "deno-irc";

  client.version = sendVersion;
  client.on("ctcp", emitCtcpVersion);

  if (replyEnabled) {
    client.on("ctcp_version", replyToCtcpVersion);
  }

  function sendVersion(target?: string) {
    if (target === undefined) {
      client.send("VERSION");
    } else {
      client.ctcp(target, "VERSION");
    }
  }

  function emitCtcpVersion(msg: Ctcp) {
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
  }

  function replyToCtcpVersion(msg: CtcpVersion) {
    const ctcpPayload = createCtcp("VERSION", version);
    client.send("NOTICE", msg.origin.nick, ctcpPayload);
  }
};
