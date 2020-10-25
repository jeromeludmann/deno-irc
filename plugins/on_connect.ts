import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { JoinPluginParams } from "./join.ts";
import type { OperPluginParams } from "./oper.ts";
import type { RegisterPluginParams } from "./register.ts";

export interface Options {
  /** Channels to join on connect. */
  channels?: string[];

  /** Sets as operator on connect. */
  oper?: {
    /** Username operator. */
    user: string;
    /** Password operator. */
    pass: string;
  };
}

export interface OnConnectPluginParams {
  options: Options;
}

function autoJoin(
  client: ExtendedClient<
    OnConnectPluginParams & JoinPluginParams & RegisterPluginParams
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

function autoOper(
  client: ExtendedClient<
    OnConnectPluginParams & OperPluginParams & RegisterPluginParams
  >,
) {
  if (client.options.oper === undefined) {
    return;
  }

  const { user, pass } = client.options.oper;

  client.on("register", () => {
    client.oper(user, pass);
  });
}

export const plugin = createPlugin<
  & OnConnectPluginParams
  & JoinPluginParams
  & OperPluginParams
  & RegisterPluginParams
>(autoOper, autoJoin);
