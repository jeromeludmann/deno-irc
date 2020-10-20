import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  kill(nick: string, comment: string): void;
}

export interface Events {
  "kill": Kill;
}

export interface Kill {
  origin: UserMask;
  nick: string;
  comment: string;
}

export interface KillPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<KillPluginParams>) {
  client.kill = client.send.bind(client, "KILL");
}

function events(client: ExtendedClient<KillPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "KILL") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick, comment] = msg.params;
    client.emit("kill", { origin, nick, comment });
  });
}

export const plugin = createPlugin(commands, events);
