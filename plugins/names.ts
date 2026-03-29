import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import chanmodes from "./chanmodes.ts";

/** Map of nicknames to their prefix arrays for a channel. */
export type Names = Record<string, string[]>;

/** Parameters carried by a NAMES reply event. */
export interface NamesReplyEventParams {
  /** Name of the channel. */
  channel: string;

  /** Nicknames joined to this channel. */
  names: Names;
}

/** Emitted when the full NAMES list for a channel has been received. */
export type NamesReplyEvent = Message<NamesReplyEventParams>;

export interface NamesFeatures {
  commands: {
    /** Gets the nicknames joined to a channel and their prefixes. */
    names(channels: string | string[]): void;
  };
  events: {
    "names_reply": NamesReplyEvent;
  };
}

const plugin: Plugin<NamesFeatures, AnyPlugins> = createPlugin(
  "names",
  [cap, chanmodes],
)((client) => {
  const buffers: Record<string, Names> = {};

  client.state.caps.requested.push("multi-prefix");

  // Sends NAMES command.

  client.names = (channels): void => {
    if (!Array.isArray(channels)) channels = [channels];
    client.send("NAMES", channels.join(","));
  };

  // Emits 'names_reply' event.

  client.on("raw:rpl_namreply", (msg) => {
    const [, , channel, prefixedNicks] = msg.params;
    buffers[channel] ??= {};

    for (const prefixedNick of prefixedNicks.split(" ")) {
      const prefixes = [];

      // extracts prefixes and nick from prefixed nick

      for (const char of prefixedNick) {
        if (char in client.state.prefixes) prefixes.push(char);
        else break; // all prefixes pushed
      }

      const nick = prefixedNick.slice(prefixes.length);

      // adds prefixes to nick entry

      const currentPrefixesLength = Object.keys(client.state.prefixes).length;
      buffers[channel][nick] = Array(currentPrefixesLength).fill("");

      for (const prefix of prefixes) {
        const index = client.state.prefixes[prefix].priority;
        buffers[channel][nick][index] = prefix;
      }
    }
  });

  client.on("raw:rpl_endofnames", (msg) => {
    const { source, params: [, channel] } = msg;

    if (channel in buffers) {
      client.emit("names_reply", {
        source,
        params: { channel, names: buffers[channel] },
      });

      delete buffers[channel];
    }
  });
});

export default plugin;
