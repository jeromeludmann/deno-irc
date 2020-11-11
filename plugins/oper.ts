import { createPlugin, ExtendedClient } from "../core/client.ts";

export interface OperParams {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };
}

function commands(client: ExtendedClient<OperParams>) {
  client.oper = (...params) => client.send("OPER", ...params);
}

export const oper = createPlugin(commands);
