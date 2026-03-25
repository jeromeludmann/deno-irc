import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

/** Parameters carried by an account event. */
export interface AccountEventParams {
  /** Account name. `"*"` means the user logged out. */
  account: string;
}

/** Emitted when a user's account changes (login/logout). */
export type AccountEvent = Message<AccountEventParams>;

interface AccountNotifyFeatures {
  events: {
    "account": AccountEvent;
  };
}

const plugin: Plugin<AccountNotifyFeatures, AnyPlugins> = createPlugin(
  "account_notify",
  [cap],
)((client) => {
  client.state.capabilities.push("account-notify");

  client.on("raw:account", (msg) => {
    const { source, params: [account] } = msg;
    client.emit("account", { source, params: { account } });
  });
});

export default plugin;
