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

export const joinOnInvite: Plugin<
  & JoinParams
  & InviteParams
  & RegisterOnConnectParams
  & JoinOnInviteParams
> = (client, options) => {
  const enabled = options.joinOnInvite ?? false;

  if (enabled) {
    client.on("invite", joinChannel);
  }

  function joinChannel(msg: Invite) {
    if (msg.nick === client.state.nick) {
      client.join(msg.channel);
    }
  }
};
