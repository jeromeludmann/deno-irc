import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { Nick, NickParams } from "./nick.ts";
import { Register, RegisterParams } from "./register.ts";

export interface RegisterOnConnectParams {
  options: {
    /** The nick used to register the client to the server. */
    nick: string;

    /** The username used to register the client to the server. */
    username?: string;

    /** The realname used to register the client to the server. */
    realname?: string;

    /** The password used to connect the client to the server. */
    password?: string;
  };

  state: {
    nick: string;
    username: string;
    realname: string;
  };
}

export const registerOnConnect: Plugin<
  & NickParams
  & RegisterParams
  & RegisterOnConnectParams
> = (client, options) => {
  const nickname = options.nick;
  const username = options.username ?? nickname;
  const realname = options.realname ?? nickname;
  const password = options.password;

  const { state } = client;
  state.nick = nickname;
  state.username = username;
  state.realname = realname;

  client.on("connected", register);
  client.on("raw", resolveNotRegistered);
  client.on("register", setNickState);
  client.on("nick", trackNickChange);

  function register() {
    if (password !== undefined) {
      client.pass(password);
    }

    client.nick(nickname);
    client.user(username, realname);
  }

  function resolveNotRegistered(msg: Raw) {
    if (msg.command === "ERR_NOTREGISTERED") {
      register();
    }
  }

  function setNickState(msg: Register) {
    client.state.nick = msg.nick;
  }

  function trackNickChange(msg: Nick) {
    const { state } = client;

    if (msg.origin.nick === state.nick) {
      state.nick = msg.nick;
    }
  }
};
