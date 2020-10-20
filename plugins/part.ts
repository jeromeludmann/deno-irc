import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  part(channel: string, comment?: string): void;
}

export interface Events {
  "part": Part;
}

export interface Part {
  origin: UserMask;
  channel: string;
  comment: string;
}

export interface PartPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<PartPluginParams>) {
  client.part = client.send.bind(client, "PART");
}

function events(client: ExtendedClient<PartPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "PART") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, comment] = msg.params;

    client.emit("part", { origin, channel, comment });
  });
}

export const plugin = createPlugin(commands, events);
