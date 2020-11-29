import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

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

export const kill: Plugin<KillParams> = (client) => {
  client.kill = sendKill;
  client.on("raw", emitKill);

  function sendKill(...params: string[]) {
    client.send("KILL", ...params);
  }

  function emitKill(msg: Raw) {
    if (msg.command !== "KILL") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick, comment] = msg.params;

    client.emit("kill", {
      origin,
      nick,
      comment,
    });
  }
};
