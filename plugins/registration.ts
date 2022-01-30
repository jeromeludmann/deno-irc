import { createPlugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import nick from "./nick.ts";
import register from "./register.ts";

export interface User {
  nick: string;
  username: string;
  realname: string;
}

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
    user: User;
  };
}

export default createPlugin(
  "registration",
  [cap, nick, register],
)<RegistrationFeatures>((client, options) => {
  const { nick, username = nick, realname = nick, password } = options;
  client.state.user = { nick, username, realname };

  const sendCapabilities = () => {
    const { capabilities } = client.state;

    if (capabilities.length === 0) {
      return;
    }

    for (const capability of capabilities) {
      client.cap("REQ", capability);
    }

    client.cap("END");
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
