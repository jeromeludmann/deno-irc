import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface JoinParams {
  commands: {
    /** Joins `channels` with optional keys.
     *
     *      client.join("#channel");
     *      client.join("#channel1", ["#channel2", "key"]); */
    join(...params: ChannelsDescription): void;
  };

  events: {
    "join": Join;
  };
}

export type ChannelsDescription = [
  channel: string | [channel: string, key: string],
  ...channels: (string | [channel: string, key: string])[],
];

export interface Join {
  /** User who sent the JOIN. */
  origin: UserMask;

  /** Channel joined by the user. */
  channel: string;
}

export const join: Plugin<JoinParams> = (client) => {
  client.join = sendJoin;
  client.on("raw", emitJoin);

  function sendJoin(...params: ChannelsDescription) {
    const channels = [];
    const keys = [];

    for (const param of params) {
      if (typeof param === "string") {
        channels.push(param);
        keys.push("");
      } else {
        channels.push(param[0]);
        keys.push(param[1]);
      }
    }

    const commandParams = [channels.join(",")];

    if (keys.some((key) => key !== "")) {
      commandParams.push(keys.join(","));
    }

    client.send("JOIN", ...commandParams);
  }

  function emitJoin(msg: Raw) {
    if (msg.command !== "JOIN") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel] = msg.params;

    client.emit("join", {
      origin,
      channel,
    });
  }
};
