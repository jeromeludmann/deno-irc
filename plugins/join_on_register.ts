import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { JoinParams } from "./join.ts";
import type { RegisterParams } from "./register.ts";

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
