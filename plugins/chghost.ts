import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

/** Parameters carried by a chghost event. */
export interface ChghostEventParams {
  /** New username. */
  username: string;

  /** New hostname. */
  hostname: string;
}

/** Emitted when a user's host or ident changes. */
export type ChghostEvent = Message<ChghostEventParams>;

interface ChghostFeatures {
  events: {
    "chghost": ChghostEvent;
  };
}

const plugin: Plugin<ChghostFeatures, AnyPlugins> = createPlugin(
  "chghost",
  [cap],
)((client) => {
  client.state.caps.requested.push("chghost");

  client.on("raw:chghost", (msg) => {
    const { source, params: [username, hostname] } = msg;
    client.emit("chghost", { source, params: { username, hostname } });
  });
});

export default plugin;
