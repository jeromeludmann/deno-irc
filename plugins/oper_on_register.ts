import { Plugin } from "../core/client.ts";
import { OperParams } from "./oper.ts";
import { RegisterParams } from "./register.ts";

export interface OperOnRegisterParams {
  options: {
    /** Sets as operator on connect. */
    oper?: {
      /** Username operator. */
      user: string;

      /** Password operator. */
      pass: string;
    };
  };
}

export const operOnRegisterPlugin: Plugin<
  & RegisterParams
  & OperParams
  & OperOnRegisterParams
> = (client, options) => {
  const { user, pass } = options.oper ?? {};

  if (!user || !pass) {
    return;
  }

  const setAsOperator = () => {
    client.oper(user, pass);
  };

  client.on("register", setAsOperator);
};
