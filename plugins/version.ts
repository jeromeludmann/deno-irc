import { Plugin } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { createCtcp, CtcpEvent, CtcpParams } from "./ctcp.ts";

export interface CtcpVersionEvent {
  /** User who sent the CTCP VERSION query. */
  origin: UserMask;

  /** Target who received the CTCP VERSION query. */
  target: string;
}

export interface CtcpVersionReplyEvent {
  /** User who sent the CTCP VERSION reply. */
  origin: UserMask;

  /** Target who received the CTCP VERSION reply. */
  target: string;

  /** Client version of the user. */
  version: string;
}

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
    "ctcp_version": CtcpVersionEvent;
    "ctcp_version_reply": CtcpVersionReplyEvent;
  };
}

const DEFAULT_VERSION = "deno-irc";

export const versionPlugin: Plugin<
  & CtcpParams
  & VersionParams
> = (client, options) => {
  const version = options.ctcpReplies?.version ?? DEFAULT_VERSION;

  const sendVersion = (target?: string) => {
    if (target === undefined) {
      client.send("VERSION");
    } else {
      client.ctcp(target, "VERSION");
    }
  };

  const emitCtcpVersion = (msg: CtcpEvent) => {
    if (msg.command !== "VERSION") {
      return;
    }

    const { origin, target, param: version } = msg;

    switch (msg.type) {
      case "query":
        client.emit("ctcp_version", { origin, target });
        break;

      case "reply":
        if (version === undefined) break;
        client.emit("ctcp_version_reply", { origin, target, version });
        break;
    }
  };

  client.version = sendVersion;
  client.on("ctcp", emitCtcpVersion);

  if (version === false) {
    return;
  }

  const replyToCtcpVersion = (msg: CtcpVersionEvent) => {
    const ctcp = createCtcp("VERSION", version);
    client.send("NOTICE", msg.origin.nick, ctcp);
  };

  client.on("ctcp_version", replyToCtcpVersion);
};
