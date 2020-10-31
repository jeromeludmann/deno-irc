import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickPluginParams } from "./nick.ts";
import type { RegisterPluginParams } from "./register.ts";
import type { RegisterOnConnectPluginParams } from "./register_on_connect.ts";

export interface State {
  nick: string;
}

export interface NickStatePluginParams {
  state: State;
}

function state(
  client: ExtendedClient<
    & NickStatePluginParams
    & NickPluginParams
    & RegisterPluginParams
    & RegisterOnConnectPluginParams
  >,
) {
  // on new instance
  client.state.nick = client.options.nick;

  // on register
  client.on("register", (msg) => {
    client.state.nick = msg.nick;
  });

  // on nick change
  client.on("nick", (msg) => {
    if (msg.origin.nick === client.state.nick) {
      client.state.nick = msg.nick;
    }
  });
}

export const plugin = createPlugin(state);
