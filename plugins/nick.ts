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
  const sendNick = (...params: string[]) => {
    client.send("NICK", ...params);
  };

  const emitNick = (msg: Raw) => {
    if (msg.command !== "NICK") {
      return;
    }

    const { prefix, params: [nick] } = msg;
    const origin = parseUserMask(prefix);

    client.emit("nick", { origin, nick });
  };

  client.nick = sendNick;
  client.on("raw", emitNick);
};
