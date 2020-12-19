import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface QuitParams {
  commands: {
    /** Leaves the server with an optional `comment`.
     *
     * Resolves after closing link. */
    quit(comment?: string): Promise<void>;
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

export const quit: Plugin<QuitParams> = (client) => {
  client.quit = sendQuit;
  client.on("raw", emitQuit);

  async function sendQuit(...params: string[]) {
    await client.send("QUIT", ...params);
    client.disconnect();
  }

  function emitQuit(msg: Raw) {
    if (msg.command !== "QUIT") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [comment] = msg.params;

    client.emit("quit", {
      origin,
      comment,
    });
  }
};
