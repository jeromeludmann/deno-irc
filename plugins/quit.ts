import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface QuitParams {
  commands: {
    /** Leaves the server with an optional `comment`. */
    quit(comment?: string): void;
  };
  events: {
    "quit": Quit;
  };
}

export interface Quit {
  /** User who sent the QUIT. */
  origin: UserMask;
  /** Optional comment of the QUIT. */
  comment?: string;
}

function commands(client: ExtendedClient<QuitParams>) {
  client.quit = (comment) => {
    // When the client sends a "QUIT", the server replies with an "ERROR".
    // Since "ERROR" are converted to thrown errors when there is no "error"
    // event listener, this following prevents the client from throwing.
    client.once("error");

    client.send("QUIT", comment ?? "");
  };
}

function events(client: ExtendedClient<QuitParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "QUIT") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [comment] = msg.params;

    client.emit("quit", { origin, comment });
  });
}

export const quit = createPlugin(commands, events);
