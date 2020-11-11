import { createPlugin, ExtendedClient } from "../core/client.ts";
import { NickParams } from "./nick.ts";
import { RegisterParams } from "./register.ts";

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
}

function autoRegister(
  client: ExtendedClient<RegisterOnConnectParams & RegisterParams & NickParams>,
) {
  const {
    nick,
    username = nick,
    realname = nick,
    password,
  } = client.options;

  const register = () => {
    if (password !== undefined) {
      client.pass(password);
    }
    client.nick(nick);
    client.user(username, realname);
  };

  client.on("connected", () => {
    register();
  });

  client.on("raw", (msg) => {
    if (msg.command === "ERR_NOTREGISTERED") {
      register();
    }
  });
}

export const registerOnConnect = createPlugin(autoRegister);
