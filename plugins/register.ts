import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters for the register event (RPL_WELCOME). */
export interface RegisterEventParams {
  /** Nick who is registered. */
  nick: string;

  /** Text of the RPL_WELCOME. */
  text: string;
}

/** Event emitted when the client is successfully registered on the server. */
export type RegisterEvent = Message<RegisterEventParams>;

export interface RegisterFeatures {
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

const plugin: Plugin<RegisterFeatures> = createPlugin("register")((client) => {
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

export default plugin;
