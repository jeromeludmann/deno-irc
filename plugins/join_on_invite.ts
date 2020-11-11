import { createPlugin, ExtendedClient } from "../core/client.ts";
import { InviteParams } from "./invite.ts";
import { JoinParams } from "./join.ts";
import { UserStateParams } from "./user_state.ts";

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
    & UserStateParams
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
