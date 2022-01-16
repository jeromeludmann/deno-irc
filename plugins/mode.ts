import { type Plugin } from "../core/client.ts";
import { parseUserMask, type Raw, type UserMask } from "../core/parsers.ts";
import { isChannel, isNick, isUserMask } from "../core/strings.ts";
import { type IsupportParams, type Modes } from "./isupport.ts";

export interface Mode {
  /** Mode letter. */
  mode: string;

  /** Optional mode argument. */
  arg?: string;
}

export interface ModeEvent extends Mode {
  /** Origin of the MODE. */
  origin: UserMask | string;

  /** Target of the MODE. */
  target: string;
}

export interface UserModeEvent extends Mode {
  /** Origin of the MODE. */
  origin: UserMask | string;

  /** Nick related to this mode. */
  nick: string;
}

export interface ChannelModeEvent extends Mode {
  /** Origin of the MODE. */
  origin: UserMask | string;

  /** Channel related to this mode. */
  channel: string;
}

export interface UserModeReplyEvent {
  /** Nick related to this mode. */
  nick: string;

  /** All the modes currently set. */
  modes: Mode[];
}

export interface ChannelModeReplyEvent {
  /** Channel related to this mode. */
  channel: string;

  /** All the modes currently set. */
  modes: Mode[];
}

export interface ModeParams {
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
    "mode:user": UserModeEvent;
    "mode:channel": ChannelModeEvent;
    "mode_reply:user": UserModeReplyEvent;
    "mode_reply:channel": ChannelModeReplyEvent;
  };
}

export const modePlugin: Plugin<IsupportParams & ModeParams> = (client) => {
  const sendModeCommand = (...params: string[]) => {
    client.send("MODE", ...params);
  };

  const parseModes = (
    rawModes: string,
    args: string[],
    supportedModes: Modes,
  ): Mode[] => {
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
  };

  const emitModeEvent = (msg: Raw) => {
    const { supported } = client.state;

    switch (msg.command) {
      case "MODE": {
        const { prefix, params: [target, modeLetters, ...params] } = msg;

        // TODO Provide public utilities to make inference easier
        const origin = isUserMask(prefix) ? parseUserMask(prefix) : prefix;

        const supportedModes = isChannel(target)
          ? supported.modes.channel
          : supported.modes.user;

        const modes = parseModes(modeLetters, params, supportedModes);

        for (const { mode, arg } of modes) {
          client.emit("mode", {
            origin,
            target,
            mode,
            ...(arg !== undefined ? { arg } : {}),
          });
        }

        break;
      }

      case "RPL_UMODEIS": {
        const [nick, rawModes] = msg.params;
        const modes = parseModes(rawModes, [], supported.modes.user);
        client.emit("mode_reply:user", { nick, modes });
        break;
      }

      case "RPL_CHANNELMODEIS": {
        const [channel, rawModes, ...args] = msg.params;
        const modes = parseModes(rawModes, args, supported.modes.channel);
        client.emit("mode_reply:channel", { channel, modes });
        break;
      }
    }
  };

  const emitUserModeEvent = (msg: ModeEvent) => {
    if (!isNick(msg.target)) {
      return;
    }

    const { origin, target: nick, mode, arg } = msg;

    client.emit("mode:user", {
      origin,
      nick,
      mode,
      ...(arg !== undefined ? { arg } : {}),
    });
  };

  const emitChannelModeEvent = (msg: ModeEvent) => {
    if (!isChannel(msg.target)) {
      return;
    }

    const { origin, target: channel, mode, arg } = msg;

    client.emit("mode:channel", {
      origin,
      channel,
      mode,
      ...(arg !== undefined ? { arg } : {}),
    });
  };

  client.mode = sendModeCommand;
  client.on("raw", emitModeEvent);
  client.on("mode", emitUserModeEvent);
  client.on("mode", emitChannelModeEvent);
};
