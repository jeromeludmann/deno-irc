import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface QuitEventParams {
  /** Optional comment of the QUIT. */
  comment?: string;
}

export type QuitEvent = Message<QuitEventParams>;

interface QuitFeatures {
  commands: {
    /** Leaves the server with an optional `comment`.
     *
     * Resolves after closing link. */
    quit(comment?: string): Promise<void>;
  };
  events: {
    "quit": QuitEvent;
  };
}

export default createPlugin("quit")<QuitFeatures>((client) => {
  // Sends QUIT command.
  client.quit = async (...params: string[]) => {
    await client.send("QUIT", ...params);
    client.disconnect();
  };

  // Emits 'quit' event.
  client.on("raw:quit", (msg) => {
    const { source, params: [comment] } = msg;
    client.emit("quit", { source, params: { comment } });
  });
});
