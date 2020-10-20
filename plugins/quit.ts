import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  quit(message?: string): void;
}

export interface Events {
  "quit": Quit;
}

export interface Quit {
  origin: UserMask;
  message: string;
}

export interface QuitPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<QuitPluginParams>) {
  client.quit = (message) => {
    // When the client sends a "QUIT", the server replies with an "ERROR".
    // Since "ERROR" are converted to thrown errors when there is no "error"
    // event listener, this following prevents the client from throwing.
    client.once("error");

    client.send("QUIT", message ?? "");
  };
}

function events(client: ExtendedClient<QuitPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "QUIT") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [message] = msg.params;

    client.emit("quit", { origin, message });
  });
}

export const plugin = createPlugin(commands, events);
