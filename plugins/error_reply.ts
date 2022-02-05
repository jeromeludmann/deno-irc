import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { type AnyError, PROTOCOL } from "../core/protocol.ts";

export interface ErrorReplyEventParams {
  args: string[];
  text?: string;
}

export type ErrorReplyEvent = Message<ErrorReplyEventParams> & {
  command: AnyError;
};

interface ErrorReplyFeatures {
  events: {
    "error_reply": ErrorReplyEvent;
  };
}

const ALL_RAW_ERROR_REPLY_EVENTS = Object
  .values(PROTOCOL.ERRORS)
  .map((command) => `raw:${command}` as const);

export default createPlugin("error_reply")<ErrorReplyFeatures>((client) => {
  // Emits 'error_reply' on **all** error replies.

  client.on(ALL_RAW_ERROR_REPLY_EVENTS, (msg) => {
    const { source, command, params } = msg;

    const args = params.slice();
    const text = args.pop();

    client.emit("error_reply", {
      source,
      command: command as AnyError,
      params: { args, text },
    });
  });
});
