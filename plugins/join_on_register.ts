import { Plugin } from "../core/client.ts";
import { ChannelsDescription, JoinParams } from "./join.ts";
import { RegisterParams } from "./register.ts";

export interface JoinOnRegisterParams {
  options: {
    /** Channels to join on connect. */
    channels?: ChannelsDescription;
  };
}

export const joinOnRegister: Plugin<
  & RegisterParams
  & JoinParams
  & JoinOnRegisterParams
> = (client, options) => {
  const channels = options.channels;

  if (channels === undefined) {
    return;
  }

  const joinChannels = () => {
    client.join(...channels);
  };

  client.on("register", joinChannels);
};
