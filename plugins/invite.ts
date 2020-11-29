import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

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

export const invite: Plugin<InviteParams> = (client) => {
  client.invite = sendInvite;
  client.on("raw", emitInvite);

  function sendInvite(...params: string[]) {
    client.send("INVITE", ...params);
  }

  function emitInvite(msg: Raw) {
    if (msg.command !== "INVITE") {
      return;
    }

    const [nick, channel] = msg.params;

    client.emit("invite", {
      origin: parseUserMask(msg.prefix),
      nick,
      channel,
    });
  }
};
