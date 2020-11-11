import { createPlugin, ExtendedClient } from "../core/client.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";

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
  client.quit = (...params: string[]) => client.send("QUIT", ...params);
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
