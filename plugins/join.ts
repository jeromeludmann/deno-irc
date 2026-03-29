import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by a JOIN event. */
export interface JoinEventParams {
  /** Channel joined by the user. */
  channel: string;
}

/** Emitted when a user joins a channel. */
export type JoinEvent = Message<JoinEventParams>;

/** Tuple of channel names or [channel, key] pairs for joining. */
export type ChannelDescriptions = [
  channel: string | [channel: string, key: string],
  ...channels: (string | [channel: string, key: string])[],
];

export interface JoinFeatures {
  commands: {
    /** Joins `channels` with optional keys.
     *
     * ```ts
     * client.join("#channel");
     * client.join("#channel1", ["#channel2", "key"]);
     * ``` */
    join(...params: ChannelDescriptions): void;
  };
  events: {
    "join": JoinEvent;
  };
}

const plugin: Plugin<JoinFeatures> = createPlugin("join")((client) => {
  // Sends JOIN command.

  client.join = (...channelDescriptions) => {
    const channels = [];
    const keys = [];

    for (const desc of channelDescriptions) {
      if (typeof desc === "string") {
        channels.push(desc);
        keys.push("");
      } else {
        channels.push(desc[0]);
        keys.push(desc[1]);
      }
    }

    const commandParams = [channels.join(",")];

    if (keys.some((key) => key !== "")) {
      commandParams.push(keys.join(","));
    }

    client.send("JOIN", ...commandParams);
  };

  // Emits 'join' events.

  client.on("raw:join", (msg) => {
    const { source, params: [channel] } = msg;
    client.emit("join", { source, params: { channel } });
  });
});

export default plugin;
