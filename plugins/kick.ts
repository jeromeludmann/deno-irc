import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by a KICK event. */
export interface KickEventParams {
  /** Channel where the nick is kicked. */
  channel: string;

  /** Nick who is kicked. */
  nick: string;

  /** Optional comment of the KICK. */
  comment?: string;
}

/** Emitted when a user is kicked from a channel. */
export type KickEvent = Message<KickEventParams>;

interface KickFeatures {
  commands: {
    /** Kicks a `nick` from a `channel` with an optional `comment`. */
    kick(channel: string, nick: string, comment?: string): void;
  };
  events: {
    "kick": KickEvent;
  };
}

const plugin: Plugin<KickFeatures> = createPlugin("kick")((client) => {
  // Sends KICK command.
  client.kick = (channel, nick, comment) => {
    client.send("KICK", channel, nick, comment);
  };

  // Emits 'kick' event.
  client.on("raw:kick", (msg) => {
    const { source, params: [channel, nick, comment] } = msg;
    client.emit("kick", { source, params: { channel, nick, comment } });
  });
});

export default plugin;
