import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

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
  client.nick = client.send.bind(client, "NICK");
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
