import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by a KILL event. */
export interface KillEventParams {
  /** Nick who is killed. */
  nick: string;

  /** Comment of the KILL. */
  comment: string;
}

/** Emitted when a user is killed (forcibly disconnected) from the server. */
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

const plugin: Plugin<KillFeatures> = createPlugin("kill")((client) => {
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

export default plugin;
