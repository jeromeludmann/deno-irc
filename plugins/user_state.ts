import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickParams } from "./nick.ts";
import type { RegisterParams } from "./register.ts";
import type { RegisterOnConnectParams } from "./register_on_connect.ts";

export interface UserStateParams {
  state: {
    nick: string;
    username: string;
    realname: string;
  };
}

function state(
  client: ExtendedClient<
    & UserStateParams
    & NickParams
    & RegisterParams
    & RegisterOnConnectParams
  >,
) {
  const { nick, username = nick, realname = nick } = client.options;

  // on new instance
  client.state = { ...client.state, nick, username, realname };

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

export const userState = createPlugin(state);
