import { createPlugin, ExtendedClient } from "../core/client.ts";
import { parseUserMask, UserMask } from "../core/parsers.ts";

export interface InviteParams {
  commands: {
    /** Invites a `nick` to a `channel`. */
    invite(nick: string, channel: string): void;
  };
  events: {
    "invite": Invite;
  };
}

export interface Invite {
  /** User who sent the INVITE. */
  origin: UserMask;
  /** Nick who was invited. */
  nick: string;
  /** Channel where the nick was invited. */
  channel: string;
}

function commands(client: ExtendedClient<InviteParams>) {
  client.invite = (...params) => client.send("INVITE", ...params);
}

function events(client: ExtendedClient<InviteParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "INVITE") {
      return;
    }

    const [nick, channel] = msg.params;

    client.emit("invite", {
      origin: parseUserMask(msg.prefix),
      nick,
      channel,
    });
  });
}

export const invite = createPlugin(commands, events);
