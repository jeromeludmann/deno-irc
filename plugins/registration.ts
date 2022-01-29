import { createPlugin } from "../core/plugins.ts";
import nick from "./nick.ts";
import register from "./register.ts";

export interface User {
  nick: string;
  username: string;
  realname: string;
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

interface RegistrationFeatures {
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

export default createPlugin(
  "registration",
  [nick, register],
)<RegistrationFeatures>((client, options) => {
  const { nick, username = nick, realname = nick, password } = options;
  client.state.capabilities = [];
  client.state.user = { nick, username, realname };

  const sendCapabilities = () => {
    const { capabilities } = client.state;

    const cap = (command: AnyCapabilityCommand, ...params: string[]) =>
      client.send("CAP", command, ...params);

    if (capabilities.length > 0) {
      for (const capability of capabilities) {
        cap("REQ", capability);
      }
      cap("END");
    }
  };

  const sendRegistration = () => {
    if (password !== undefined) {
      client.pass(password);
    }
    client.nick(nick);
    client.user(username, realname);
  };

  // Sends capabilities and registers once connected.

  client.on("connected", () => {
    sendCapabilities();
    sendRegistration();
  });

  // Registers if receives ERR_NOTREGISTERED message

  client.on("raw:err_notregistered", () => {
    sendRegistration();
  });

  // Initializes 'nick' state.

  client.on("register", (msg) => {
    client.state.user.nick = msg.params.nick;
  });

  // Updates 'nick' state.

  client.on("nick", (msg) => {
    const { source, params } = msg;
    const { user } = client.state;

    if (source?.name === user.nick) {
      user.nick = params.nick;
    }
  });
});
