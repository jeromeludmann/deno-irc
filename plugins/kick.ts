import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  kick(channel: string, nick: string, comment?: string): void;
}

export interface Events {
  "kick": Kick;
}

export interface Kick {
  origin: UserMask;
  channel: string;
  nick: string;
  comment: string;
}

export interface KickPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<KickPluginParams>) {
  client.kick = client.send.bind(client, "KICK");
}

function events(client: ExtendedClient<KickPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "KICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, nick, comment] = msg.params;
    client.emit("kick", { origin, channel, nick, comment });
  });
}

export const plugin = createPlugin(commands, events);
