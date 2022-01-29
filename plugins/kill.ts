import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface KillEventParams {
  /** Nick who is killed. */
  nick: string;

  /** Comment of the KILL. */
  comment: string;
}

export type KillEvent = Message<KillEventParams>;

interface KillFeatures {
  commands: {
    /** Kills a `nick` from the server with a `comment`. */
    kill(nick: string, comment: string): void;
  };
  events: {
    "kill": KillEvent;
  };
}

export default createPlugin("kill")<KillFeatures>((client) => {
  // Sends KILL command.
  client.kill = (nick, comment) => {
    client.send("KILL", nick, comment);
  };

  // Emits 'kill' event.
  client.on("raw:kill", (msg) => {
    const { source, params: [nick, comment] } = msg;
    client.emit("kill", { source, params: { nick, comment } });
  });
});
