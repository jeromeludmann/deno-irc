import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickParams } from "./nick.ts";
import type { RegisterParams } from "./register.ts";
import type { RegisterOnConnectParams } from "./register_on_connect.ts";

export interface NickStateParams {
  state: {
    nick: string;
  };
}

function state(
  client: ExtendedClient<
    & NickStateParams
    & NickParams
    & RegisterParams
    & RegisterOnConnectParams
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

export const nickState = createPlugin(state);
