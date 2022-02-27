import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface JoinEventParams {
  /** Channel joined by the user. */
  channel: string;
}

export type JoinEvent = Message<JoinEventParams>;

export type ChannelDescriptions = [
  channel: string | [channel: string, key: string],
  ...channels: (string | [channel: string, key: string])[],
];

interface JoinFeatures {
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

export default createPlugin("join")<JoinFeatures>((client) => {
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
