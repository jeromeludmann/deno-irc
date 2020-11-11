import { createPlugin, ExtendedClient } from "../core/client.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";

export interface KillParams {
  commands: {
    /** Kills a `nick` from the server with a `comment`. */
    kill(nick: string, comment: string): void;
  };
  events: {
    "kill": Kill;
  };
}

export interface Kill {
  /** User who sent the KILL. */
  origin: UserMask;
  /** Nick who is killed. */
  nick: string;
  /** Comment of the KILL. */
  comment: string;
}

function commands(client: ExtendedClient<KillParams>) {
  client.kill = (...params) => client.send("KILL", ...params);
}

function events(client: ExtendedClient<KillParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "KILL") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick, comment] = msg.params;
    client.emit("kill", { origin, nick, comment });
  });
}

export const kill = createPlugin(commands, events);
