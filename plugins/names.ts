import { type Plugin } from "../core/client.ts";
import { type Raw } from "../core/parsers.ts";
import { type IsupportParams } from "./isupport.ts";

export type Names = Record<string, string[]>;

export interface NamesReplyEvent {
  /** Name of the channel. */
  channel: string;

  /** Nicknames joined to this channel. */
  names: Names;
}

export interface NamesParams {
  commands: {
    /** Gets the nicknames joined to a channel and their prefixes. */
    names(channels: string | string[]): void;
  };
  events: {
    "names_reply": NamesReplyEvent;
  };
}

export const namesPlugin: Plugin<IsupportParams & NamesParams> = (client) => {
  const sendNamesCommand = (channels: string[]): void => {
    if (!Array.isArray(channels)) channels = [channels];
    client.send("NAMES", channels.join(","));
  };

  const emitNamesReplyEvent = (msg: Raw) => {
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
        const [, channel] = msg.params;

        if (channel in buffers) {
          client.emit("names_reply", {
            channel,
            names: buffers[channel],
          });

          delete buffers[channel];
        }

        break;
      }
    }
  };

  const buffers: Record<string, Names> = {};

  client.names = sendNamesCommand;
  client.on("raw", emitNamesReplyEvent);
};
