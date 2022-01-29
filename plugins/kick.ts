import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface KickEventParams {
  /** Channel where the nick is kicked. */
  channel: string;

  /** Nick who is kicked. */
  nick: string;

  /** Optional comment of the KICK. */
  comment?: string;
}

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

export default createPlugin("kick")<KickFeatures>((client) => {
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
