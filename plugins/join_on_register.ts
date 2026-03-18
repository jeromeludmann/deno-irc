import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import join, { type ChannelDescriptions } from "./join.ts";
import register from "./register.ts";

interface JoinOnRegisterFeatures {
  options: {
    /** Channels to join on connect. */
    channels?: ChannelDescriptions;
  };
}

const plugin: Plugin<JoinOnRegisterFeatures, AnyPlugins> = createPlugin(
  "join_on_register",
  [join, register],
)((client, options) => {
  const channels = options.channels;
  if (!channels) return;

  // Joins provided channel once registered.
  client.on("register", () => {
    client.join(...channels);
  });
});

export default plugin;
