import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";

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
      /** Replies to CTCP VERSION with the given string.
       *
       * Default to `"deno-irc"`. `false` to disable. */
      version?: string | false;
    };
  };
  commands: {
    /** Queries the client version of a `target`.
     *
     * Queries the server if `target` is not provided. */
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
  // Sends VERSION command.

  client.version = (target) => {
    if (target === undefined) {
      client.send("VERSION");
    } else {
      client.ctcp(target, "VERSION");
    }
  };

  // Emits 'ctcp_version' and 'ctcp_version_reply' events.

  client.on("raw_ctcp:version", (msg) => {
    const { source, params: { target } } = msg;
    client.emit("ctcp_version", { source, params: { target } });
  });

  client.on("raw_ctcp:version_reply", (msg) => {
    const { source, params: { arg: version } } = msg;
    client.emit("ctcp_version_reply", { source, params: { version } });
  });

  // Replies to CTCP VERSION.

  const version = options.ctcpReplies?.version ?? DEFAULT_VERSION;
  if (version === false) return;

  client.on("ctcp_version", (msg) => {
    const { source } = msg;
    if (source) {
      const ctcp = client.utils.createCtcp("VERSION", version);
      client.send("NOTICE", source.name, ctcp);
    }
  });
});
