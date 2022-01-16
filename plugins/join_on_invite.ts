import { type Plugin } from "../core/client.ts";
import { type InviteEvent, type InviteParams } from "./invite.ts";
import { type JoinParams } from "./join.ts";
import { type RegistrationParams } from "./registration.ts";

export interface JoinOnInviteParams {
  options: {
    /** Enables auto join on invite. */
    joinOnInvite?: boolean;
  };
}

const DEFAULT_JOIN_ON_INVITE = false;

export const joinOnInvitePlugin: Plugin<
  & JoinParams
  & InviteParams
  & RegistrationParams
  & JoinOnInviteParams
> = (client, options) => {
  const joinChannel = (msg: InviteEvent) => {
    if (msg.nick === client.state.nick) {
      client.join(msg.channel);
    }
  };

  const enabled = options.joinOnInvite ?? DEFAULT_JOIN_ON_INVITE;
  if (!enabled) return;

  client.on("invite", joinChannel);
};
