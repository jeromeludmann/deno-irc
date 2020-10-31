import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

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

function commands(client: ExtendedClient<JoinParams>) {
  client.join = (...channels: string[]) => {
    client.send("JOIN", channels.join(","));
  };
}

function events(client: ExtendedClient<JoinParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "JOIN") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel] = msg.params;
    client.emit("join", { origin, channel });
  });
}

export const join = createPlugin(commands, events);
