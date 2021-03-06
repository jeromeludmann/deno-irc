import { Plugin } from "../core/client.ts";
import { Invite, InviteParams } from "./invite.ts";
import { JoinParams } from "./join.ts";
import { RegisterOnConnectParams } from "./register_on_connect.ts";

export interface JoinOnInviteParams {
  options: {
    /** Enables auto join on invite. */
    joinOnInvite?: boolean;
  };
}

const DEFAULT_JOIN_ON_INVITE = false;

export const joinOnInvite: Plugin<
  & JoinParams
  & InviteParams
  & RegisterOnConnectParams
  & JoinOnInviteParams
> = (client, options) => {
  const enabled = options.joinOnInvite ?? DEFAULT_JOIN_ON_INVITE;

  if (!enabled) {
    return;
  }

  const joinChannel = (msg: Invite) => {
    if (msg.nick === client.state.nick) {
      client.join(msg.channel);
    }
  };

  client.on("invite", joinChannel);
};
