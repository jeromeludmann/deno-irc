import { createPlugin, ExtendedClient } from "../core/client.ts";
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

function autoOper(
  client: ExtendedClient<
    OperOnRegisterParams & OperParams & RegisterParams
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

export const operOnRegister = createPlugin(autoOper);
