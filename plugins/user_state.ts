import { createPlugin, ExtendedClient } from "../core/client.ts";
import { NickParams } from "./nick.ts";
import { RegisterParams } from "./register.ts";
import { RegisterOnConnectParams } from "./register_on_connect.ts";

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

  client.state.nick = nick;
  client.state.username = username;
  client.state.realname = realname;

  client.on("register", (msg) => {
    client.state.nick = msg.nick;
  });

  client.on("nick", (msg) => {
    if (msg.origin.nick === client.state.nick) {
      client.state.nick = msg.nick;
    }
  });
}

export const userState = createPlugin(state);
