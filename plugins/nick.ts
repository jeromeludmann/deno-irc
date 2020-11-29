import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface NickParams {
  commands: {
    /** Sets the `nick` of the client (once connected). */
    nick(nick: string): void;
  };

  events: {
    "nick": Nick;
  };
}

export interface Nick {
  /** User who sent the NICK. */
  origin: UserMask;

  /** New nick used by the user. */
  nick: string;
}

export const nick: Plugin<NickParams> = (client) => {
  client.nick = sendNick;
  client.on("raw", emitNick);

  function sendNick(...params: string[]) {
    client.send("NICK", ...params);
  }

  function emitNick(msg: Raw) {
    if (msg.command !== "NICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick] = msg.params;

    client.emit("nick", {
      origin,
      nick,
    });
  }
};
