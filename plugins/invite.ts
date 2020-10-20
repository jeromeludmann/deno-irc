import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";
import type { JoinPluginParams } from "./join.ts";
import type { NickPluginParams } from "./nick.ts";

export interface Options {
  /** Enables auto join on invite. */
  joinOnInvite?: boolean;
}

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
  options: Options;
}

function options(client: ExtendedClient<InvitePluginParams>) {
  client.options.joinOnInvite ??= false;
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

function joinOnInvite(
  client: ExtendedClient<
    & InvitePluginParams
    & JoinPluginParams
    & NickPluginParams
  >,
) {
  if (!client.options.joinOnInvite) {
    return;
  }

  client.on("invite", (msg) => {
    if (msg.nick === client.state.nick) {
      client.join(msg.channel);
    }
  });
}

export const plugin = createPlugin(
  options,
  commands,
  events,
  joinOnInvite,
);
