import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { OperPluginParams } from "./oper.ts";
import type { RegisterPluginParams } from "./register.ts";

export interface Options {
  /** Sets as operator on connect. */
  oper?: {
    /** Username operator. */
    user: string;
    /** Password operator. */
    pass: string;
  };
}

export interface OperOnRegisterPluginParams {
  options: Options;
}

function operOnRegister(
  client: ExtendedClient<
    OperOnRegisterPluginParams & OperPluginParams & RegisterPluginParams
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

export const plugin = createPlugin(operOnRegister);
