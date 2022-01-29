import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface RegisterEventParams {
  /** Nick who is registered. */
  nick: string;

  /** Text of the RPL_WELCOME. */
  text: string;
}

export type RegisterEvent = Message<RegisterEventParams>;

interface RegisterFeatures {
  commands: {
    /** Sets the username and the realname. Registration only. */
    user(username: string, realname: string): void;

    /** Sets the password of the server. Registration only. */
    pass(password: string): void;
  };
  events: {
    "register": RegisterEvent;
  };
}

export default createPlugin("register")<RegisterFeatures>((client) => {
  // Sends USER command.

  client.user = (username, realname) => {
    client.send("USER", username, "0", "*", realname);
  };

  // Sends PASS command.

  client.pass = (password) => {
    client.send("PASS", password);
  };

  // Emits 'register' event.

  client.on("raw:rpl_welcome", (msg) => {
    const { source, params: [nick, text] } = msg;
    client.emit("register", { source, params: { nick, text } });
  });
});
