import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp, { createCtcp } from "./ctcp.ts";

export interface CtcpVersionEventParams {
  /** Target of the CTCP VERSION query. */
  target: string;
}

export type CtcpVersionEvent = Message<CtcpVersionEventParams>;

export interface CtcpVersionReplyEventParams {
  /** Client version of the user. */
  version: string;
}

export type CtcpVersionReplyEvent = Message<CtcpVersionReplyEventParams>;

interface VersionFeatures {
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

export default createPlugin(
  "version",
  [ctcp],
)<VersionFeatures>((client, options) => {
  const version = options.ctcpReplies?.version ?? DEFAULT_VERSION;

  // Sends VERSION command.
  client.version = (target) => {
    if (target === undefined) {
      client.send("VERSION");
    } else {
      client.ctcp(target, "VERSION");
    }
  };

  // Emits 'ctcp_version' event.
  client.on("ctcp", (msg) => {
    if (msg.command === "VERSION") {
      const { source, params: { type, target, param: version } } = msg;
      switch (type) {
        case "query":
          client.emit("ctcp_version", { source, params: { target } });
          break;
        case "reply":
          if (version !== undefined) {
            client.emit("ctcp_version_reply", { source, params: { version } });
          }
          break;
      }
    }
  });

  // Replies to CTCP VERSION.
  if (version === false) return;
  client.on("ctcp_version", (msg) => {
    const { source } = msg;
    if (source) {
      const ctcp = createCtcp("VERSION", version);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
