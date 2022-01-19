import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import isupport from "./isupport.ts";
import registration from "./registration.ts";

export type Names = Record<string, string[]>;

export interface NamesReplyEventParams {
  /** Name of the channel. */
  channel: string;

  /** Nicknames joined to this channel. */
  names: Names;
}

export type NamesReplyEvent = Message<NamesReplyEventParams>;

interface NamesFeatures {
  commands: {
    /** Gets the nicknames joined to a channel and their prefixes. */
    names(channels: string | string[]): void;
  };
  events: {
    "names_reply": NamesReplyEvent;
  };
}

export default createPlugin(
  "names",
  [isupport, registration],
)<NamesFeatures>((client) => {
  const buffers: Record<string, Names> = {};
  client.state.capabilities.push("multi-prefix");

  // Sends NAMES command.
  client.names = (channels): void => {
    if (!Array.isArray(channels)) channels = [channels];
    client.send("NAMES", channels.join(","));
  };

  // Emits 'names_reply' event.
  client.on("raw", (msg) => {
    const { supported } = client.state;

    switch (msg.command) {
      case "RPL_NAMREPLY": {
        const [, , channel, prefixedNicks] = msg.params;
        buffers[channel] ??= {};

        for (const prefixedNick of prefixedNicks.split(" ")) {
          const prefixes = [];

          // extracts prefixes from prefixed nick
          for (const char of prefixedNick) {
            if (char in supported.prefixes) prefixes.push(char);
            else break;
          }

          // extracts nick from prefixed nick
          const nick = prefixedNick.slice(prefixes.length);

          buffers[channel][nick] = [];

          // adds prefixes to nick entry
          for (const prefix of prefixes) {
            const index = supported.prefixes[prefix].priority;
            buffers[channel][nick][index] = prefix;
          }
        }

        break;
      }

      case "RPL_ENDOFNAMES": {
        const { source, params: [, channel] } = msg;

        if (channel in buffers) {
          client.emit("names_reply", {
            source,
            params: { channel, names: buffers[channel] },
          });

          delete buffers[channel];
        }

        break;
      }
    }
  });
});
