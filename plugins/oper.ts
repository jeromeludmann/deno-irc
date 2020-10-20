import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface Commands {
  /** Sets the client as operator with a `user` and a `password`.  */
  oper(user: string, password: string): void;
}

export interface OperPluginParams {
  commands: Commands;
}

function commands(client: ExtendedClient<OperPluginParams>) {
  client.oper = client.send.bind(client, "OPER");
}

export const plugin = createPlugin(commands);
