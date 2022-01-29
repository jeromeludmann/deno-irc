import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface PartEventParams {
  /** Channel left by the user. */
  channel: string;

  /** Optional comment of the PART. */
  comment?: string;
}

export type PartEvent = Message<PartEventParams>;

interface PartFeatures {
  commands: {
    /** Leaves the `channel` with an optional `comment`. */
    part(channel: string, comment?: string): void;
  };
  events: {
    "part": PartEvent;
  };
}

export default createPlugin("part")<PartFeatures>((client) => {
  // Sends PART command.

  client.part = (channel, comment) => {
    client.send("PART", channel, comment);
  };

  // Emits 'part' events.

  client.on("raw:part", (msg) => {
    const { source, params: [channel, comment] } = msg;
    client.emit("part", { source, params: { channel, comment } });
  });
});
