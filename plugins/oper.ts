import { Plugin } from "../core/client.ts";

export interface OperParams {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };
}

export const oper: Plugin<OperParams> = (client) => {
  const sendOper = (...params: string[]) => {
    client.send("OPER", ...params);
  };

  client.oper = sendOper;
};
