import { generateRawEvents } from "../core/client.ts";
import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";
import { type AnyError } from "../core/protocol.ts";

/** Parameters carried by an error reply from the server. */
export interface ErrorReplyEventParams {
  /** Arguments of the error. */
  args: string[];

  /** Description of the error. */
  text?: string;
}

/** Emitted when the server sends any error reply. */
export type ErrorReplyEvent = Message<ErrorReplyEventParams> & {
  command: AnyError;
};

interface ErrorReplyFeatures {
  events: {
    "error_reply": ErrorReplyEvent;
  };
}

const plugin: Plugin<ErrorReplyFeatures> = createPlugin("error_reply")(
  (client) => {
    // Emits 'error_reply' on **all** error replies.

    const errorReplyEvents = generateRawEvents("ERRORS");

    client.on(errorReplyEvents, (msg) => {
      const { source, command, params } = msg;

      const args = params.slice();
      const text = args.pop();

      client.emit("error_reply", {
        source,
        command: command as AnyError,
        params: { args, text },
      });
    });
  },
);

export default plugin;
