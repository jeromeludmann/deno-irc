import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters for a QUIT event. */
export interface QuitEventParams {
  /** Optional comment of the QUIT. */
  comment?: string;
}

/** Event emitted when a user disconnects from the server. */
export type QuitEvent = Message<QuitEventParams>;

export interface QuitFeatures {
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

const plugin: Plugin<QuitFeatures> = createPlugin("quit")((client) => {
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

export default plugin;
