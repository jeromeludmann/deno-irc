import { Plugin } from "../core/client.ts";
import { JoinParams } from "./join.ts";
import { RegisterParams } from "./register.ts";

export interface JoinOnRegisterParams {
  options: {
    /** Channels to join on connect. */
    channels?: string[];
  };
}

export const joinOnRegister: Plugin<
  & RegisterParams
  & JoinParams
  & JoinOnRegisterParams
> = (client, options) => {
  const channels = options.channels ?? [];

  if (channels.length > 0) {
    client.on("register", joinChannels);
  }

  function joinChannels() {
    client.join(...channels);
  }
};
