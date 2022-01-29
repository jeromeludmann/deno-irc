import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { isChannel } from "../core/strings.ts";
import isupport, { type Modes } from "./isupport.ts";

interface Mode {
  /** Mode letter. */
  mode: string;

  /** Optional mode argument. */
  arg?: string;
}

export type ModeEventParams = Mode & {
  /** Target of the MODE.
   *
   * Can be either a channel or a nick. */
  target: string;
};

export type ModeEvent = Message<ModeEventParams>;

export interface ModeReplyEventParams {
  /** Target of the MODE reply.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** All the modes currently set. */
  modes: Mode[];
}

export type ModeReplyEvent = Message<ModeReplyEventParams>;

interface ModeFeatures {
  commands: {
    /** Manages modes.
     *
     * Gets modes:
     *
     *      client.mode("nick");     // reply with 'mode_reply:user' event
     *      client.mode("#channel"); // reply with 'mode_reply:channel' event
     *
     * Sets modes:
     *
     *      client.mode("nick", "+w");
     *      client.mode("#chan", "+v", "nick");
     *      client.mode("#chan", "+iko", "secret", "nick"); */
    mode(target: string, modes?: string, ...args: string[]): void;
  };
  events: {
    "mode": ModeEvent;
    "mode:user": ModeEvent;
    "mode:channel": ModeEvent;
    "mode_reply": ModeReplyEvent;
    "mode_reply:user": ModeReplyEvent;
    "mode_reply:channel": ModeReplyEvent;
  };
}

function parseModes(
  rawModes: string,
  args: string[],
  supportedModes: Modes,
): Mode[] {
  const modes: Mode[] = [];
  let set: "+" | "-" | "" = "";

  for (const modeChar of rawModes) {
    if (modeChar === "+" || modeChar === "-") {
      set = modeChar;
      continue;
    }

    if (!(modeChar in supportedModes)) {
      continue;
    }

    const { type } = supportedModes[modeChar];
    const mode = set + modeChar;

    switch (type) {
      case "a":
      case "b": { // MUST always have a parameter
        const arg = args.shift();
        if (arg === undefined) break;
        modes.push({ mode, arg });
        break;
      }
      case "c": { // MUST have a parameter only when being set
        if (set === "+") {
          const arg = args.shift();
          if (arg === undefined) break;
          modes.push({ mode, arg });
        } else {
          modes.push({ mode });
        }
        break;
      }
      case "d":
      default: { // MUST NOT have a parameter
        modes.push({ mode });
        break;
      }
    }
  }

  return modes;
}

export default createPlugin("mode", [isupport])<ModeFeatures>((client) => {
  const { supported } = client.state;

  // Sends MODE command.
  client.mode = (target, modes, ...args) => {
    client.send("MODE", target, modes, ...args);
  };

  // Emits 'mode' and 'mode_reply' events.

  client.on("raw:mode", (msg) => {
    const { source, params: [target, modeLetters, ...params] } = msg;

    const supportedModes = isChannel(target)
      ? supported.modes.channel
      : supported.modes.user;

    const modes = parseModes(modeLetters, params, supportedModes);

    for (const { mode, arg } of modes) {
      const payload: ModeEvent = { source, params: { target, mode } };
      if (arg !== undefined) payload.params.arg = arg;

      client.emit("mode", payload);
      client.emit(`mode:${isChannel(target) ? "channel" : "user"}`, payload);
    }
  });

  client.on("raw:rpl_umodeis", (msg) => {
    const { source, params: [target, rawModes] } = msg;
    const modes = parseModes(rawModes, [], supported.modes.user);

    const payload: ModeReplyEvent = { source, params: { target, modes } };

    client.emit("mode_reply", payload);
    client.emit("mode_reply:user", payload);
  });

  client.on("raw:rpl_channelmodeis", (msg) => {
    const { source, params: [target, rawModes, ...args] } = msg;
    const modes = parseModes(rawModes, args, supported.modes.channel);

    const payload: ModeReplyEvent = { source, params: { target, modes } };

    client.emit("mode_reply", payload);
    client.emit("mode_reply:channel", payload);
  });
});
