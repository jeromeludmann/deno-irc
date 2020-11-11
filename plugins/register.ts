import { createPlugin, ExtendedClient } from "../core/client.ts";

export interface RegisterParams {
  commands: {
    /** Sets the username and the realname. Registration only. */
    user(username: string, realname: string): void;
    /** Sets the password of the server. Registration only. */
    pass(password: string): void;
  };
  events: {
    "register": Register;
  };
}

export interface Register {
  /** Nick who is registered. */
  nick: string;
  /** Text of the RPL_WELCOME. */
  text: string;
}

function commands(client: ExtendedClient<RegisterParams>) {
  client.user = (username, realname) =>
    client.send("USER", username, "0", "*", realname);

  client.pass = (...params) => client.send("PASS", ...params);
}

function events(client: ExtendedClient<RegisterParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "RPL_WELCOME") {
      return;
    }

    const [nick, text] = msg.params;

    return client.emit("register", {
      nick,
      text,
    });
  });
}

export const register = createPlugin(commands, events);
