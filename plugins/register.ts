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
  const sendUser = (username: string, realname: string) => {
    client.send("USER", username, "0", "*", realname);
  };

  const sendPass = (...params: string[]) => {
    client.send("PASS", ...params);
  };

  const emitRegister = (msg: Raw) => {
    if (msg.command !== "RPL_WELCOME") {
      return;
    }

    const { params: [nick, text] } = msg;
    client.emit("register", { nick, text });
  };

  client.user = sendUser;
  client.pass = sendPass;
  client.on("raw", emitRegister);
};
