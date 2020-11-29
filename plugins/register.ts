import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

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

export const register: Plugin<RegisterParams> = (client) => {
  client.user = sendUser;
  client.pass = sendPass;
  client.on("raw", emitRegister);

  function sendUser(username: string, realname: string) {
    client.send("USER", username, "0", "*", realname);
  }

  function sendPass(...params: string[]) {
    client.send("PASS", ...params);
  }

  function emitRegister(msg: Raw) {
    if (msg.command !== "RPL_WELCOME") {
      return;
    }

    const [nick, text] = msg.params;

    return client.emit("register", {
      nick,
      text,
    });
  }
};
