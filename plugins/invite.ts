import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface InviteEvent {
  /** User who sent the INVITE. */
  origin: UserMask;

  /** Nick who was invited. */
  nick: string;

  /** Channel where the nick was invited. */
  channel: string;
}

export interface InviteParams {
  commands: {
    /** Invites a `nick` to a `channel`. */
    invite(nick: string, channel: string): void;
  };
  events: {
    "invite": InviteEvent;
  };
}

export const invitePlugin: Plugin<InviteParams> = (client) => {
  const sendInvite = (...params: string[]) => {
    client.send("INVITE", ...params);
  };

  const emitInvite = (msg: Raw) => {
    if (msg.command !== "INVITE") {
      return;
    }

    const { prefix, params: [nick, channel] } = msg;
    const origin = parseUserMask(prefix);

    client.emit("invite", { origin, nick, channel });
  };

  client.invite = sendInvite;
  client.on("raw", emitInvite);
};
