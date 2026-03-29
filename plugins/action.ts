import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";

/** Parameters for a CTCP ACTION event (e.g., /me messages). */
export interface CtcpActionEventParams {
  /** Target of the CTCP ACTION. */
  target: string;

  /** Text of the CTCP ACTION. */
  text: string;
}

/** Event emitted when a CTCP ACTION message is received. */
export type CtcpActionEvent = Message<CtcpActionEventParams>;

export interface ActionFeatures {
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

const plugin: Plugin<ActionFeatures, AnyPlugins> = createPlugin("action", [
  ctcp,
])((client) => {
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

export default plugin;
