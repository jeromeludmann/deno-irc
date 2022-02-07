import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";

export interface CtcpActionEventParams {
  /** Target of the CTCP ACTION. */
  target: string;

  /** Text of the CTCP ACTION. */
  text: string;
}

export type CtcpActionEvent = Message<CtcpActionEventParams>;

interface ActionFeatures {
  commands: {
    /** Sends an action message `text` to a `target`. */
    action(target: string, text: string): void;

    /** Sends an action message `text` to a `target`. */
    me: ActionFeatures["commands"]["action"];
  };
  events: {
    "ctcp_action": CtcpActionEvent;
  };
}

export default createPlugin("action", [ctcp])<ActionFeatures>((client) => {
  // Sends CTCP ACTION command.

  client.action = client.me = (target, text) => {
    client.ctcp(target, "ACTION", text);
  };

  // Emits 'ctcp_action' event.

  client.on("raw_ctcp:action", (msg) => {
    const { source, params: { target, arg: text } } = msg;
    if (text !== undefined) {
      client.emit("ctcp_action", { source, params: { target, text } });
    }
  });
});
