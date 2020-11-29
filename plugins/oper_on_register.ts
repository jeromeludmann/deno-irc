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

export const operOnRegister: Plugin<
  & RegisterParams
  & OperParams
  & OperOnRegisterParams
> = (client, options) => {
  const enabled = !!options.oper;
  const user = options.oper?.user ?? "";
  const pass = options.oper?.pass ?? "";

  if (enabled) {
    client.on("register", setAsOper);
  }

  function setAsOper() {
    client.oper(user, pass);
  }
};
