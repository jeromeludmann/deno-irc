import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import invite from "./invite.ts";

const plugin: Plugin<Record<never, never>, AnyPlugins> = createPlugin(
  "invite_notify",
  [cap, invite],
)((client) => {
  client.state.capabilities.push("invite-notify");
});

export default plugin;
