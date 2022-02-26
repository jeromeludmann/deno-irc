import { RAW_EVENTS } from "../core/client.ts";
import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { type AnyError } from "../core/protocol.ts";

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

export default createPlugin("error_reply")<ErrorReplyFeatures>((client) => {
  // Emits 'error_reply' on **all** error replies.

  client.on(RAW_EVENTS.ERRORS, (msg) => {
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
