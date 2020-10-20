import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpPluginParams } from "./ctcp.ts";

export interface Commands {
  /** Sends an action message `text` to a `target`. */
  action(target: string, text: string): void;
  /** Sends an action message `text` to a `target`. */
  me(target: string, text: string): void;
}

export interface Events {
  "ctcp_action": CtcpAction;
}

export interface CtcpAction {
  /** User who sent the CTCP ACTION. */
  origin: UserMask;
  /** Target who received the CTCP ACTION. */
  target: string;
  /** Text of the CTCP ACTION. */
  text: string;
}

export interface ActionPluginParams {
  commands: Commands;
  events: Events;
}

function commands(
  client: ExtendedClient<ActionPluginParams & CtcpPluginParams>,
) {
  client.action = client.me = (target, text) => {
    client.ctcp(target, "ACTION", text);
  };
}

function events(client: ExtendedClient<ActionPluginParams & CtcpPluginParams>) {
  client.on("raw:ctcp", (msg) => {
    if (msg.command !== "ACTION") {
      return;
    }

    const { origin, target } = msg;

    client.emit("ctcp_action", {
      origin,
      target,
      text: msg.param!,
    });
  });
}

export const plugin = createPlugin(commands, events);
