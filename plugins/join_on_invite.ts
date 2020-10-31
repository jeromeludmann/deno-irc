import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { InvitePluginParams } from "./invite.ts";
import type { JoinPluginParams } from "./join.ts";
import type { NickStatePluginParams } from "./nick_state.ts";

export interface Options {
  /** Enables auto join on invite. */
  joinOnInvite?: boolean;
}

export interface JoinOnInvitePluginParams {
  options: Options;
}

function options(client: ExtendedClient<JoinOnInvitePluginParams>) {
  client.options.joinOnInvite ??= false;
}

function joinOnInvite(
  client: ExtendedClient<
    & JoinOnInvitePluginParams
    & InvitePluginParams
    & JoinPluginParams
    & NickStatePluginParams
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

export const plugin = createPlugin(options, joinOnInvite);
