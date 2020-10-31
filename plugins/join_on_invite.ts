import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { InviteParams } from "./invite.ts";
import type { JoinParams } from "./join.ts";
import type { NickStateParams } from "./nick_state.ts";

export interface JoinOnInviteParams {
  options: {
    /** Enables auto join on invite. */
    joinOnInvite?: boolean;
  };
}

function options(client: ExtendedClient<JoinOnInviteParams>) {
  client.options.joinOnInvite ??= false;
}

function autoJoin(
  client: ExtendedClient<
    & JoinOnInviteParams
    & InviteParams
    & JoinParams
    & NickStateParams
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

export const joinOnInvite = createPlugin(options, autoJoin);
