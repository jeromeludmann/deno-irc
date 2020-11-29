import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface JoinParams {
  commands: {
    /** Joins a `channel`. */
    join(channel: string): void;

    /** Joins `channels`. */
    join(...channels: string[]): void;
  };

  events: {
    "join": Join;
  };
}

export interface Join {
  /** User who sent the JOIN. */
  origin: UserMask;

  /** Channel joined by the user. */
  channel: string;
}

export const join: Plugin<JoinParams> = (client) => {
  client.join = sendJoin;
  client.on("raw", emitJoin);

  function sendJoin(...channels: string[]) {
    client.send("JOIN", channels.join(","));
  }

  function emitJoin(msg: Raw) {
    if (msg.command !== "JOIN") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel] = msg.params;

    client.emit("join", {
      origin,
      channel,
    });
  }
};
