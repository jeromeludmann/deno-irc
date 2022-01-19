import { createPlugin } from "../core/plugins.ts";
import oper from "./oper.ts";
import register from "./register.ts";

interface OperOnRegisterFeatures {
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

export default createPlugin(
  "oper_on_register",
  [oper, register],
)<OperOnRegisterFeatures>((client, options) => {
  const { user, pass } = options.oper ?? {};
  if (!user || !pass) return;

  // Sets as operator once registered.
  client.on("register", () => {
    client.oper(user, pass);
  });
});
