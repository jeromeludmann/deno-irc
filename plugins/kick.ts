import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface KickParams {
  commands: {
    /** Kicks a `nick` from a `channel` with an optional `comment`. */
    kick(channel: string, nick: string, comment?: string): void;
  };

  events: {
    "kick": Kick;
  };
}

export interface Kick {
  /** User who sent the KICK. */
  origin: UserMask;

  /** Channel where the nick is kicked. */
  channel: string;

  /** Nick who is kicked. */
  nick: string;

  /** Optional comment of the KICK. */
  comment?: string;
}

export const kick: Plugin<KickParams> = (client) => {
  client.kick = sendKick;
  client.on("raw", emitKick);

  function sendKick(...params: string[]) {
    client.send("KICK", ...params);
  }

  function emitKick(msg: Raw) {
    if (msg.command !== "KICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, nick, comment] = msg.params;

    client.emit("kick", {
      origin,
      channel,
      nick,
      comment,
    });
  }
};
