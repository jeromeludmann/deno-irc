import { Plugin } from "../core/client.ts";
import { UserMask } from "../core/parsers.ts";
import { Ctcp, CtcpParams } from "./ctcp.ts";

export interface ActionParams {
  commands: {
    /** Sends an action message `text` to a `target`. */
    action(target: string, text: string): void;

    /** Sends an action message `text` to a `target`. */
    me: ActionParams["commands"]["action"];
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

export const action: Plugin<CtcpParams & ActionParams> = (client) => {
  const sendAction = (target: string, text: string) => {
    client.ctcp(target, "ACTION", text);
  };

  const emitAction = (msg: Ctcp) => {
    if (
      msg.command !== "ACTION" ||
      msg.param === undefined
    ) {
      return;
    }

    const { origin, target, param: text } = msg;
    client.emit("ctcp_action", { origin, target, text });
  };

  client.action = sendAction;
  client.me = sendAction;
  client.on("ctcp", emitAction);
};
