import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface MotdParams {
  commands: {
    /** Gets the message of the day (MOTD) of the server. */
    motd(): void;
  };
  events: {
    "motd": Motd;
  };
}

export interface Motd {
  /** Message of the day (MOTD). */
  motd?: string[];
}

function commands(client: ExtendedClient<MotdParams>) {
  client.motd = client.send.bind(client, "MOTD");
}

function events(client: ExtendedClient<MotdParams>) {
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

export const motd = createPlugin(commands, events);
