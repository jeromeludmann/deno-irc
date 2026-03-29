import { type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

export interface AccountTagFeatures {
  utils: {
    /** Extracts the account name from a message's tags, if present. */
    getAccount: (msg: Raw) => string | undefined;
  };
}

const plugin: Plugin<AccountTagFeatures, AnyPlugins> = createPlugin(
  "account_tag",
  [cap],
)((client) => {
  client.state.caps.requested.push("account-tag");

  client.utils.getAccount = (msg) => {
    return msg.tags?.account;
  };
});

export default plugin;
