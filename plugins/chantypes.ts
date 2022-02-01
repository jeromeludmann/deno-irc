import { createPlugin } from "../core/plugins.ts";
import isupport from "./isupport.ts";

interface ChantypesFeatures {
  state: {
    chantypes: string;
  };
  utils: {
    /** Checks if the given `target` is a channel.
     *
     * Based on server supported features. */
    isChannel: (target: string) => boolean;
  };
}

export default createPlugin(
  "chantypes",
  [isupport],
)<ChantypesFeatures>((client) => {
  // Default 'chantypes' state.

  client.state.chantypes = "#";

  // Updates 'chantypes' state.

  client.on("isupport:chantypes", (msg) => {
    const { value } = msg.params;
    if (value) {
      client.state.chantypes = value;
    }
  });

  // Adds `isChannel` util.

  client.utils.isChannel = (target) => {
    return client.state.chantypes.includes(target.charAt(0));
  };
});
