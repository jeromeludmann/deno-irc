import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

/** Parameters carried by a setname event. */
export interface SetnameEventParams {
  /** New real name. */
  realname: string;
}

/** Emitted when a user changes their real name. */
export type SetnameEvent = Message<SetnameEventParams>;

interface SetnameFeatures {
  commands: {
    /** Changes your real name. */
    setname: (realname: string) => void;
  };
  events: {
    "setname": SetnameEvent;
  };
}

const plugin: Plugin<SetnameFeatures, AnyPlugins> = createPlugin(
  "setname",
  [cap],
)((client) => {
  client.state.capabilities.push("setname");

  client.setname = (realname) => {
    client.send("SETNAME", realname);
  };

  client.on("raw:setname", (msg) => {
    const { source, params: [realname] } = msg;
    client.emit("setname", { source, params: { realname } });
  });
});

export default plugin;
