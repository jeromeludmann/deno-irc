import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { type AnyErrorEventName, PROTOCOL } from "../core/protocol.ts";

export interface ErrorReplyEventParams {
  values: string[];
  text?: string;
}

export type ErrorReplyEvent = Message<ErrorReplyEventParams> & {
  command: AnyErrorEventName;
};

interface ErrorReplyFeatures {
  events: {
    "error_reply": ErrorReplyEvent;
  };
}

export default createPlugin("error_reply")<ErrorReplyFeatures>((client) => {
  // Emits 'error_reply' on all error replies.
  client.on("raw", (msg) => {
    if (msg.command in PROTOCOL.ERRORS) {
      const { source, command, params } = msg;

      const values = params.slice();
      const text = values.pop();

      client.emit("error_reply", {
        source,
        command: command as AnyErrorEventName,
        params: { values, text },
      });
    }
  });
});
