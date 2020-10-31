import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { JoinPluginParams } from "./join.ts";
import type { RegisterPluginParams } from "./register.ts";

export interface Options {
  /** Channels to join on connect. */
  channels?: string[];
}

export interface JoinOnRegisterPluginParams {
  options: Options;
}

function joinOnRegister(
  client: ExtendedClient<
    JoinOnRegisterPluginParams & JoinPluginParams & RegisterPluginParams
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

export const plugin = createPlugin(joinOnRegister);
