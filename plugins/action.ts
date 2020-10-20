import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { CtcpPluginParams } from "./ctcp.ts";

export interface Commands {
  action(target: string, action: string): void;
  me(target: string, action: string): void;
}

export interface Events {
  "ctcp_action": CtcpAction;
}

export interface CtcpAction {
  origin: UserMask;
  target: string;
  text: string;
}

export interface ActionPluginParams {
  commands: Commands;
  events: Events;
}

function commands(
  client: ExtendedClient<ActionPluginParams & CtcpPluginParams>,
) {
  client.action = client.me = (target, action) => {
    client.ctcp(target, "ACTION", action);
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
