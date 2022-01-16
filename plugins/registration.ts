import { type Plugin } from "../core/client.ts";
import { type Raw } from "../core/parsers.ts";
import { type NickEvent, type NickParams } from "./nick.ts";
import { type RegisterEvent, type RegisterParams } from "./register.ts";

export interface User {
  nick: string;
  username: string;
  realname: string;
}

export interface RegistrationParams {
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
    capabilities: string[];
    user: User;
  };
}

type AnyCapabilityCommand =
  | "LS"
  | "LIST"
  | "REQ"
  | "ACK"
  | "NAK"
  | "NEW"
  | "DEL"
  | "END";

export const registrationPlugin: Plugin<
  & NickParams
  & RegisterParams
  & RegistrationParams
> = (client, options) => {
  const requestCapability = (
    command: AnyCapabilityCommand,
    ...params: string[]
  ) => client.send("CAP", command, ...params);

  const register = () => {
    const { capabilities } = client.state;

    if (capabilities.length > 0) {
      for (const capability of capabilities) {
        requestCapability("REQ", capability);
      }
      requestCapability("END");
    }

    if (password !== undefined) {
      client.pass(password);
    }

    client.nick(nick);
    client.user(username, realname);
  };

  const resolveNotRegistered = (msg: Raw) => {
    if (msg.command === "ERR_NOTREGISTERED") {
      register();
    }
  };

  const setNickState = (msg: RegisterEvent) => {
    client.state.user.nick = msg.nick;
  };

  const trackNickChange = (msg: NickEvent) => {
    const { user } = client.state;

    if (msg.origin.nick === user.nick) {
      user.nick = msg.nick;
    }
  };

  const { nick, username = nick, realname = nick, password } = options;
  client.state.capabilities ??= []; // TODO depends of plugins loading order
  client.state.user = { nick, username, realname };

  client.on("connected", register);
  client.on("raw", resolveNotRegistered);
  client.on("register", setNickState);
  client.on("nick", trackNickChange);
};
