import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface OperParams {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };
}

function commands(client: ExtendedClient<OperParams>) {
  client.oper = client.send.bind(client, "OPER");
}

export const oper = createPlugin(commands);
