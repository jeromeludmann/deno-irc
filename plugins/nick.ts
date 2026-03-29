import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by a NICK event. */
export interface NickEventParams {
  /** New nick used by the user. */
  nick: string;
}

/** Emitted when a user changes their nickname. */
export type NickEvent = Message<NickEventParams>;

export interface NickFeatures {
  commands: {
    /** Sets the `nick` of the client (once connected). */
    nick(nick: string): void;
  };
  events: {
    "nick": NickEvent;
  };
}

const plugin: Plugin<NickFeatures> = createPlugin("nick")((client) => {
  // Sends 'nick' command.

  client.nick = (nick) => {
    client.send("NICK", nick);
  };

  // Emits 'nick' event.

  client.on("raw:nick", (msg) => {
    const { source, params: [nick] } = msg;
    client.emit("nick", { source, params: { nick } });
  });
});

export default plugin;
