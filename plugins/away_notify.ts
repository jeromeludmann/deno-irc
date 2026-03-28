import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

/** Parameters carried by an away_notify event. */
export interface AwayNotifyEventParams {
  /** Whether the user is away. */
  away: boolean;

  /** Away message, if the user is away. */
  message?: string;
}

/** Emitted when a user's away status changes in a shared channel. */
export type AwayNotifyEvent = Message<AwayNotifyEventParams>;

interface AwayNotifyFeatures {
  events: {
    "away_notify": AwayNotifyEvent;
  };
}

const plugin: Plugin<AwayNotifyFeatures, AnyPlugins> = createPlugin(
  "away_notify",
  [cap],
)((client) => {
  client.state.caps.requested.push("away-notify");

  client.on("raw:away", (msg) => {
    const { source, params } = msg;
    // :nick!user@host AWAY :message (away)
    // :nick!user@host AWAY          (back)
    const message = params[0];
    const away = message !== undefined && message !== "";

    client.emit("away_notify", {
      source,
      params: { away, message: away ? message : undefined },
    });
  });
});

export default plugin;
