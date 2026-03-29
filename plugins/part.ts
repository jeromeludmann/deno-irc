import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters for a PART (channel leave) event. */
export interface PartEventParams {
  /** Channel left by the user. */
  channel: string;

  /** Optional comment of the PART. */
  comment?: string;
}

/** Event emitted when a user leaves a channel. */
export type PartEvent = Message<PartEventParams>;

export interface PartFeatures {
  commands: {
    /** Leaves the `channel` with an optional `comment`. */
    part(channel: string, comment?: string): void;
  };
  events: {
    "part": PartEvent;
  };
}

const plugin: Plugin<PartFeatures> = createPlugin("part")((client) => {
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

export default plugin;
