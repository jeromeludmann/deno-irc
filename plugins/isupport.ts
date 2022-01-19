import { createPlugin } from "../core/plugins.ts";
import myinfo from "./myinfo.ts";

export interface Modes {
  [mode: string]: {
    type: string;
    prefix?: string;
  };
}

export interface Prefixes {
  [prefix: string]: {
    priority: number;
  };
}

export interface Isupport {
  modes: {
    user: Modes;
    channel: Modes;
  };
  prefixes: Prefixes;
}

interface IsupportFeatures {
  state: { supported: Isupport };
}

export const getDefaults = (): Isupport => ({
  modes: {
    user: {
      "a": { type: "d" }, // RFC2812: AWAY
      "i": { type: "d" }, // RFC1459: INVISIBLE
      "o": { type: "d" }, // RFC1459: GLOBAL_OPERATOR
      "O": { type: "d" }, // RFC2812: LOCAL_OPERATOR
      "r": { type: "d" }, // RFC2812: RESTRICTED
      "s": { type: "d" }, // RFC1459: SERVER_NOTICES
      "w": { type: "d" }, // RFC1459: WALLOPS
    },
    channel: {
      "a": { type: "b" }, // RFC2811: ANONYMOUS
      "b": { type: "a" }, // RFC1459: BAN
      "e": { type: "a" }, // RFC2811: BAN_EXCEPTION
      "i": { type: "d" }, // RFC1459: INVITE_ONLY
      "I": { type: "a" }, // RFC2811: INVITATION_MASK
      "k": { type: "b" }, // RFC1459: KEYLOCK
      "l": { type: "c" }, // RFC1459: LIMIT
      "m": { type: "d" }, // RFC1459: MODERATED
      "n": { type: "d" }, // RFC1459: NO_EXTERNAL_MSGS
      "O": { type: "b" }, // RFC2811: CREATOR
      "p": { type: "d" }, // RFC1459: PRIVATE
      "q": { type: "d" }, // RFC2811: QUIET
      "r": { type: "d" }, // RFC2811: REOP
      "s": { type: "d" }, // RFC1459: SECRET
      "t": { type: "d" }, // RFC1459: TOPIC_LOCK
      "o": { type: "b", prefix: "@" }, // RFC1459: OPER
      "h": { type: "b", prefix: "%" }, // RFC2811: HALFOP
      "v": { type: "b", prefix: "+" }, // RFC1459: VOICE
    },
  },
  prefixes: {
    "@": { priority: 0 }, // RFC1459: OPER
    "%": { priority: 1 }, // RFC2811: HALFOP
    "+": { priority: 2 }, // RFC1459: VOICE
  },
});

export default createPlugin(
  "isupport",
  [myinfo],
)<IsupportFeatures>((client) => {
  client.state.supported = getDefaults();

  // Removes useless and adds missing supported modes.
  // These supported modes can be overridden later with their type information
  // while receiving USERMODES and CHANMODES parameters from RPL_ISUPPORT.
  client.on("myinfo", (msg) => {
    const { params } = msg;
    const { supported } = client.state;

    const updateSupportedModes = (key: keyof Isupport["modes"]) => {
      for (const mode in supported.modes[key]) {
        if (!(params.modes[key].includes(mode))) {
          delete supported.modes[key][mode];
        }
      }
      for (const mode of params.modes[key]) {
        if (!(mode in supported.modes[key])) {
          supported.modes[key][mode] = { type: "d" };
        }
      }
    };

    updateSupportedModes("user");
    updateSupportedModes("channel");
  });

  // Updates supported state.
  client.on("raw", (msg) => {
    if (msg.command !== "RPL_ISUPPORT") {
      return;
    }

    const [, ...params] = msg.params;
    params.pop(); // remove useless trailing "are supported by this server"

    for (const param of params) {
      const [paramKey, paramValue = undefined] = param.split("=");
      if (paramKey.startsWith("-")) continue; // ignore unavailable feature

      let supportedModes: Modes;

      switch (paramKey) {
        case "USERMODES": // USERMODES=,,s,BIRWcgikorw
          supportedModes = client.state.supported.modes.user;
          // USERMODES always falls through CHANMODES with `supportedModes` set.
        case "CHANMODES": { // CHANMODES=IXbeg,k,Hfjl,ACKMOPRTcimnprstz
          supportedModes ??= client.state.supported.modes.channel;
          if (paramValue === undefined) break;

          // Do NOT reset supported modes here!
          // Keep existing defaults and only override them. Following lines
          // should always work with both USERMODES and CHANMODES.

          let modeType = "a".charCodeAt(0);

          for (const modeChar of paramValue) {
            const type = { type: String.fromCharCode(modeType) };
            modeChar === "," ? ++modeType : (supportedModes[modeChar] = type);
          }

          break;
        }

        case "PREFIX": { // PREFIX=(qaohv)~&@%+
          if (paramValue === undefined) break;
          const match = paramValue.match(/\((.*?)\)(.*)/);
          if (match === null) break;

          const [, mode, prefixes] = match;

          // ALWAYS RESET supported prefixes here
          // in order to avoid prefix priority offsets!
          client.state.supported.prefixes = {};

          for (let i = 0; i < mode.length; ++i) {
            client.state.supported.prefixes[prefixes[i]] = { priority: i };
            client.state.supported.modes.channel[mode[i]] = {
              type: "b", // RFC: modes coming from PREFIX should always be treated as type 'b'
              prefix: prefixes[i],
            };
          }

          break;
        }
      }
    }
  });
});
