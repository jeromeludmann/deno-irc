import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import chanmodes, { type Modes } from "./chanmodes.ts";
import usermodes from "./usermodes.ts";
import chantypes from "./chantypes.ts";

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
     * **Gets Modes:**
     *
     * ```ts
     * client.mode("nick");
     * client.mode("#channel");
     * ```
     *
     * Following these commands, server should respectively reply with
     * `"mode_reply:user"` or `"mode_reply:channel"` events.
     *
     * **Sets Modes:**
     *
     * ```ts
     * client.mode("nick", "+w");
     * client.mode("#chan", "e");
     * client.mode("#chan", "+v", "nick");
     * client.mode("#chan", "+iko", "secret", "nick");
     * ``` */
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

export default createPlugin(
  "mode",
  [chanmodes, usermodes, chantypes],
)<ModeFeatures>((client) => {
  function parseModes(rawModes: string[], supportedModes: Modes): Mode[] {
    const modes: Mode[] = [];
    let modeSet: "+" | "-" | "" = "";
    let modeChars = "";
    const modeArgs = [];

    // from:
    //   rawModes: ["+o", "nick1", "+v", "nick2", "+m"]
    //
    // to:
    //   modeChars: "+ovm"
    //   modeArgs: ["nick1", "nick2"]

    for (const rawMode of rawModes) {
      rawMode.charAt(0) === "+" || rawMode.charAt(0) === "-"
        ? modeChars += rawMode
        : modeArgs.push(rawMode);
    }

    // from:
    //   modeChars: "+ovm"
    //   modeArgs: ["nick1", "nick2"]
    //
    // to:
    //   modes: [
    //     { mode: "+o", arg: "nick1" },
    //     { mode: "+v", arg: "nick2" }
    //     { mode: "+m" }
    //   ]

    for (const modeChar of modeChars) {
      if (modeChar === "+" || modeChar === "-") {
        modeSet = modeChar;
        continue;
      }

      const type = modeChar in supportedModes
        ? supportedModes[modeChar].type
        : "d"; // considers without parameter if mode is unknown
      const mode = modeSet + modeChar;

      switch (type) {
        case "a":
        case "b": { // MUST always have a parameter
          const arg = modeArgs.shift();
          if (arg !== undefined) {
            modes.push({ mode, arg });
          }
          break;
        }
        case "c": { // MUST have a parameter only when being set
          if (modeSet === "+") {
            const arg = modeArgs.shift();
            if (arg !== undefined) {
              modes.push({ mode, arg });
            }
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

  // Sends MODE command.

  client.mode = (target, modes, ...args) => {
    client.send("MODE", target, modes, ...args);
  };

  // Emits 'mode' and 'mode_reply' events.

  client.on("raw:mode", (msg) => {
    const { source, params } = msg;
    const [target, ...rawModes] = params;

    const isChannel = client.utils.isChannel(target);

    const supportedModes = isChannel
      ? client.state.chanmodes
      : client.state.usermodes;

    const modes = parseModes(rawModes, supportedModes);

    for (const { mode, arg } of modes) {
      const payload: ModeEvent = { source, params: { target, mode } };
      if (arg !== undefined) payload.params.arg = arg;

      client.emit("mode", payload);
      client.emit(isChannel ? "mode:channel" : "mode:user", payload);
    }
  });

  // Emits 'mode_reply:*' events.

  client.on(["raw:rpl_umodeis", "raw:rpl_channelmodeis"], (msg) => {
    const { source, params } = msg;
    const [target, ...rawModes] = params;

    const isChannel = client.utils.isChannel(target);

    const supportedModes = isChannel
      ? client.state.chanmodes
      : client.state.usermodes;

    const modes = parseModes(rawModes, supportedModes);
    const payload: ModeReplyEvent = { source, params: { target, modes } };

    client.emit("mode_reply", payload);
    client.emit(isChannel ? "mode_reply:channel" : "mode_reply:user", payload);
  });
});
