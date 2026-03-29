import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import oper from "./oper.ts";
import register from "./register.ts";

export interface OperOnRegisterFeatures {
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

const plugin: Plugin<OperOnRegisterFeatures, AnyPlugins> = createPlugin(
  "oper_on_register",
  [oper, register],
)((client, options) => {
  const { user, pass } = options.oper ?? {};
  if (!user || !pass) return;

  // Sets as operator once registered.
  client.on("register", () => {
    client.oper(user, pass);
  });
});

export default plugin;
