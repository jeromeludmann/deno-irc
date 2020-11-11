import { createPlugin, ExtendedClient } from "../core/client.ts";
import { JoinParams } from "./join.ts";
import { RegisterParams } from "./register.ts";

export interface JoinOnRegisterParams {
  options: {
    /** Channels to join on connect. */
    channels?: string[];
  };
}

function autoJoin(
  client: ExtendedClient<
    JoinOnRegisterParams & JoinParams & RegisterParams
  >,
) {
  const { channels } = client.options;

  if (channels === undefined || channels.length === 0) {
    return;
  }

  client.on("register", () => {
    client.join(...channels);
  });
}

export const joinOnRegister = createPlugin(autoJoin);
