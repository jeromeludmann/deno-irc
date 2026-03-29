import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by a standard reply event (FAIL, WARN, NOTE). */
export interface StandardReplyEventParams {
  /** The command this reply relates to (e.g. "CHATHISTORY", "JOIN"). */
  command: string;

  /** Machine-readable code (e.g. "ACCOUNT_REQUIRED"). */
  code: string;

  /** Optional context parameters between code and description. */
  context: string[];

  /** Human-readable description. */
  description: string;
}

/** Emitted on FAIL, WARN, or NOTE standard reply. */
export type StandardReplyEvent = Message<StandardReplyEventParams>;

export interface StandardRepliesFeatures {
  events: {
    "fail": StandardReplyEvent;
    "warn": StandardReplyEvent;
    "note": StandardReplyEvent;
  };
}

function parseStandardReply(params: string[]): StandardReplyEventParams {
  const command = params[0] ?? "";
  const code = params[1] ?? "";
  const description = params.length > 2 ? params[params.length - 1] : "";
  const context = params.length > 3 ? params.slice(2, -1) : [];
  return { command, code, context, description };
}

const plugin: Plugin<StandardRepliesFeatures, AnyPlugins> = createPlugin(
  "standard_replies",
  [],
)((client) => {
  for (const event of ["fail", "warn", "note"] as const) {
    client.on(`raw:${event}`, (msg) => {
      client.emit(event, {
        source: msg.source,
        params: parseStandardReply(msg.params),
      });
    });
  }
});

export default plugin;
