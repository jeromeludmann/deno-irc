import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import { type AnyRawCommand } from "../core/protocol.ts";
import cap from "./cap.ts";

export interface LabeledResponseFeatures {
  commands: {
    /** Sends a command with an auto-generated label tag. */
    labeled: (command: AnyRawCommand, ...params: string[]) => void;
  };
}

const plugin: Plugin<LabeledResponseFeatures, AnyPlugins> = createPlugin(
  "labeled_response",
  [cap],
)((client) => {
  client.state.caps.requested.push("labeled-response");

  let counter = 0;

  client.labeled = (command, ...params) => {
    const label = "L" + ++counter;
    client.send({ label }, command, ...params);
  };
});

export default plugin;
