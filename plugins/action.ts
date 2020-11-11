import { createPlugin, ExtendedClient } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { CtcpParams } from "./ctcp.ts";

export interface ActionParams {
  commands: {
    /** Sends an action message `text` to a `target`. */
    action(target: string, text: string): void;
    /** Sends an action message `text` to a `target`. */
    me(target: string, text: string): void;
  };
  events: {
    "ctcp_action": CtcpAction;
  };
}

export interface CtcpAction {
  /** User who sent the CTCP ACTION. */
  origin: UserMask;
  /** Target who received the CTCP ACTION. */
  target: string;
  /** Text of the CTCP ACTION. */
  text: string;
}

function commands(
  client: ExtendedClient<ActionParams & CtcpParams>,
) {
  client.action = client.me = (target, text) =>
    client.ctcp(target, "ACTION", text);
}

function events(client: ExtendedClient<ActionParams & CtcpParams>) {
  client.on("ctcp", (msg) => {
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

export const action = createPlugin(commands, events);
