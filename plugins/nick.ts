import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface NickEventParams {
  /** New nick used by the user. */
  nick: string;
}

export type NickEvent = Message<NickEventParams>;

interface NickFeatures {
  commands: {
    /** Sets the `nick` of the client (once connected). */
    nick(nick: string): void;
  };
  events: {
    "nick": NickEvent;
  };
}

export default createPlugin("nick")<NickFeatures>((client) => {
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
