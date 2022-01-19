import { createPlugin } from "../core/plugins.ts";
import join, { type ChannelDescriptions } from "./join.ts";
import register from "./register.ts";

interface JoinOnRegisterFeatures {
  options: {
    /** Channels to join on connect. */
    channels?: ChannelDescriptions;
  };
}

export default createPlugin(
  "join_on_register",
  [join, register],
)<JoinOnRegisterFeatures>((client, options) => {
  const channels = options.channels;
  if (!channels) return;

  // Joins provided channel once registered.
  client.on("register", () => {
    client.join(...channels);
  });
});
