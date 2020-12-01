import { FatalError, Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface JoinParams {
  commands: {
    /** Joins `channels` with optional keys.
     *
     *      client.join("#channel");
     *      client.join("#channel1", ["#channel2", "key"]); */
    join(...channels: (string | ChannelWithKey)[]): void;
  };

  events: {
    "join": Join;
  };
}

export type ChannelWithKey = [channel: string, key: string];

export interface Join {
  /** User who sent the JOIN. */
  origin: UserMask;

  /** Channel joined by the user. */
  channel: string;
}

export const join: Plugin<JoinParams> = (client) => {
  client.join = sendJoin;
  client.on("raw", emitJoin);

  function sendJoin(...params: (string | ChannelWithKey)[]) {
    if (params.length === 0) {
      client.emit(
        "error",
        new FatalError("write", "join requires at least one channel"),
      );
    }

    const channels: string[] = [];
    const keys: (string | null)[] = [];

    for (const param of params) {
      if (typeof param === "string") {
        channels.push(param);
        keys.push(null);
      } else {
        channels.push(param[0]);
        keys.push(param[1]);
      }
    }

    client.send(
      "JOIN",
      channels.join(","),
      keys.some((key) => key !== null) ? keys.join(",") : "",
    );
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
