import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface PartParams {
  commands: {
    /** Leaves the `channel` with an optional `comment`. */
    part(channel: string, comment?: string): void;
  };

  events: {
    "part": Part;
  };
}

export interface Part {
  /** User who sent the PART. */
  origin: UserMask;

  /** Channel left by the user. */
  channel: string;

  /** Optional comment of the PART. */
  comment?: string;
}

export const part: Plugin<PartParams> = (client) => {
  const sendPart = (...params: string[]) => {
    client.send("PART", ...params);
  };

  const emitPart = (msg: Raw) => {
    if (msg.command !== "PART") {
      return;
    }

    const { prefix, params: [channel, comment] } = msg;
    const origin = parseUserMask(prefix);

    client.emit("part", { origin, channel, comment });
  };

  client.part = sendPart;
  client.on("raw", emitPart);
};
