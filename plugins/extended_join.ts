import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import join from "./join.ts";

/** Parameters carried by an extended_join event. */
export interface ExtendedJoinEventParams {
  /** Channel name. */
  channel: string;

  /** Account name. `"*"` if the user is not logged in. */
  account: string;

  /** Real name. */
  realname: string;
}

/** Emitted when a user joins a channel with extended-join enabled. */
export type ExtendedJoinEvent = Message<ExtendedJoinEventParams>;

interface ExtendedJoinFeatures {
  events: {
    "extended_join": ExtendedJoinEvent;
  };
}

const plugin: Plugin<ExtendedJoinFeatures, AnyPlugins> = createPlugin(
  "extended_join",
  [cap, join],
)((client) => {
  client.state.caps.requested.push("extended-join");

  client.on("raw:join", (msg) => {
    const { source, params } = msg;
    // Extended format: channel account realname
    if (params.length < 3) return;
    const [channel, account, realname] = params;

    client.emit("extended_join", {
      source,
      params: { channel, account, realname },
    });
  });
});

export default plugin;
