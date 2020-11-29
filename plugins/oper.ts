import { Plugin } from "../core/client.ts";

export interface OperParams {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };
}

export const oper: Plugin<OperParams> = (client) => {
  client.oper = sendOper;

  function sendOper(...params: string[]) {
    client.send("OPER", ...params);
  }
};
