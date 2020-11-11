import { createPlugin, ExtendedClient } from "../core/client.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";

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

function commands(client: ExtendedClient<NickParams>) {
  client.nick = (...params) => client.send("NICK", ...params);
}

function events(client: ExtendedClient<NickParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "NICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick] = msg.params;

    client.emit("nick", { origin, nick });
  });
}

export const nick = createPlugin(commands, events);
