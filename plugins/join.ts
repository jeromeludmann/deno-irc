import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  /** Joins a `channel`. */
  join(channel: string): void;
  /** Joins `channels`. */
  join(...channels: string[]): void;
}

export interface Events {
  "join": Join;
}

export interface Join {
  /** User who sent the JOIN. */
  origin: UserMask;
  /** Channel joined by the user. */
  channel: string;
}

export interface JoinPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<JoinPluginParams>) {
  client.join = (...channels: string[]) => {
    client.send("JOIN", channels.join(","));
  };
}

function events(client: ExtendedClient<JoinPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "JOIN") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel] = msg.params;
    client.emit("join", { origin, channel });
  });
}

export const plugin = createPlugin(commands, events);
