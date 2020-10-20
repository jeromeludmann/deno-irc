import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface Commands {
  motd(): void;
}

export interface Events {
  "motd": Motd;
}

export interface Motd {
  motd?: string[];
}

export interface MotdPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<MotdPluginParams>) {
  client.motd = client.send.bind(client, "MOTD");
}

function events(client: ExtendedClient<MotdPluginParams>) {
  let motd: string[];

  client.on("raw", (msg) => {
    switch (msg.command) {
      case "RPL_MOTDSTART":
        motd = [];
        break;

      case "RPL_MOTD":
        const [, text] = msg.params;
        motd.push(text);
        break;

      case "RPL_ENDOFMOTD":
        client.emit("motd", { motd });
        break;

      case "ERR_NOMOTD":
        client.emit("motd", { motd: undefined });
        break;
    }
  });
}

export const plugin = createPlugin(commands, events);
