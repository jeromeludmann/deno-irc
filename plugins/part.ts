import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface PartParams {
  commands: {
    /** Leaves the `channel` with an optional `comment`. */
    part(channel: string, comment?: string): void;
  };
  events: {
    "part": Part;
  };
}

export interface Part {
  /** User who sent the PART. */
  origin: UserMask;
  /** Channel left by the user. */
  channel: string;
  /** Optional comment of the PART. */
  comment?: string;
}

function commands(client: ExtendedClient<PartParams>) {
  client.part = client.send.bind(client, "PART");
}

function events(client: ExtendedClient<PartParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "PART") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, comment] = msg.params;

    client.emit("part", { origin, channel, comment });
  });
}

export const part = createPlugin(commands, events);
