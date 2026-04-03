import { type Mask } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import chanmodes from "./chanmodes.ts";
import names from "./names.ts";

/** Map of nicks to their user@host masks for a channel. */
export type UserhostMap = Record<string, Mask>;

export interface UserhostInNamesFeatures {
  state: {
    /** Map of channel names to nick -> Mask lookup.
     *  Populated when userhost-in-names cap is enabled. */
    userhosts: Record<string, UserhostMap>;
  };
}

const plugin: Plugin<UserhostInNamesFeatures, AnyPlugins> = createPlugin(
  "userhost_in_names",
  [cap, chanmodes, names],
)((client) => {
  client.state.caps.requested.push("userhost-in-names");
  client.state.userhosts = {};

  const buffers: Record<string, UserhostMap> = {};

  client.on("raw:rpl_namreply", (msg) => {
    const [, , channel, prefixedNicks] = msg.params;
    buffers[channel] ??= {};

    for (const prefixedNick of prefixedNicks.split(" ")) {
      // Strip prefixes.
      let i = 0;
      while (
        i < prefixedNick.length && prefixedNick[i] in client.state.prefixes
      ) {
        i++;
      }

      const raw = prefixedNick.slice(i);
      const bangIndex = raw.indexOf("!");
      if (bangIndex === -1) continue;

      const nick = raw.slice(0, bangIndex);
      const atIndex = raw.indexOf("@", bangIndex);
      if (atIndex === -1) continue;

      const user = raw.slice(bangIndex + 1, atIndex);
      const host = raw.slice(atIndex + 1);

      buffers[channel][nick] = { user, host };
    }
  });

  client.on("names_reply", (msg) => {
    const { channel } = msg.params;
    if (channel in buffers) {
      client.state.userhosts[channel] = buffers[channel];
      delete buffers[channel];
    }
  });

  client.on("disconnected", () => {
    client.state.userhosts = {};
    for (const key in buffers) delete buffers[key];
  });
});

export default plugin;
