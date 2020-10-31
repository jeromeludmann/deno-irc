import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface KickParams {
  commands: {
    /** Kicks a `nick` from a `channel` with an optional `comment`. */
    kick(channel: string, nick: string, comment?: string): void;
  };
  events: {
    "kick": Kick;
  };
}

export interface Kick {
  /** User who sent the KICK. */
  origin: UserMask;
  /** Channel where the nick is kicked. */
  channel: string;
  /** Nick who is kicked. */
  nick: string;
  /** Optional comment of the KICK. */
  comment?: string;
}

function commands(client: ExtendedClient<KickParams>) {
  client.kick = client.send.bind(client, "KICK");
}

function events(client: ExtendedClient<KickParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "KICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, nick, comment] = msg.params;
    client.emit("kick", { origin, channel, nick, comment });
  });
}

export const kick = createPlugin(commands, events);
