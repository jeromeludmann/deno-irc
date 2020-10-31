import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  /** Invites a `nick` to a `channel`. */
  invite(nick: string, channel: string): void;
}

export interface Events {
  "invite": Invite;
}

export interface Invite {
  /** User who sent the INVITE. */
  origin: UserMask;
  /** Nick who was invited. */
  nick: string;
  /** Channel where the nick was invited. */
  channel: string;
}

export interface InvitePluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<InvitePluginParams>) {
  client.invite = client.send.bind(client, "INVITE");
}

function events(client: ExtendedClient<InvitePluginParams>) {
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

export const plugin = createPlugin(commands, events);
