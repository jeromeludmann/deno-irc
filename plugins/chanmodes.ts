import { createPlugin } from "../core/plugins.ts";
import myinfo from "./myinfo.ts";
import isupport from "./isupport.ts";

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

interface ChanmodesFeatures {
  state: {
    chanmodes: Modes;
    prefixes: Prefixes;
  };
}

export default createPlugin(
  "chanmodes",
  [myinfo, isupport],
)<ChanmodesFeatures>((client) => {
  // Default 'chanmodes' state.

  client.state.chanmodes = {
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
  };

  // Default 'prefixes' state.

  client.state.prefixes = {
    "@": { priority: 0 }, // RFC1459: OPER
    "%": { priority: 1 }, // RFC2811: HALFOP
    "+": { priority: 2 }, // RFC1459: VOICE
  };

  // Removes useless and adds missing supported modes.
  // These supported modes can be overridden later with their type information
  // while receiving CHANMODES parameters from RPL_ISUPPORT.

  client.on("myinfo", (msg) => {
    const { params } = msg;

    for (const mode in client.state.chanmodes) {
      if (!(params.chanmodes.includes(mode))) {
        delete client.state.chanmodes[mode];
      }
    }
    for (const mode of params.chanmodes) {
      if (!(mode in client.state.chanmodes)) {
        client.state.chanmodes[mode] = { type: "d" };
      }
    }
  });

  // Updates 'chanmodes' state.

  client.on("isupport:chanmodes", (msg) => {
    const { params: { value: paramValue } } = msg;
    if (paramValue === undefined) return;

    // Do NOT reset supported modes here!
    // Keep existing defaults and only override them. Following lines
    // should always work with both USERMODES and CHANMODES.

    let modeType = "a".charCodeAt(0);

    // CHANMODES=IXbeg,k,Hfjl,ACKMOPRTcimnprstz
    for (const modeChar of paramValue) {
      const type = { type: String.fromCharCode(modeType) };
      modeChar === "," ? ++modeType : (client.state.chanmodes[modeChar] = type);
    }
  });

  // Updates nick 'prefixes' state.

  client.on("isupport:prefix", (msg) => {
    const { params: { value } } = msg;

    if (value === undefined) {
      return;
    }

    // PREFIX=(qaohv)~&@%+
    const match = value.match(/^\((.+?)\)(.+)$/);
    if (match === null) {
      return;
    }

    const [, mode, prefixes] = match;

    // ALWAYS RESET 'prefixes' state here
    // in order to keep prefix priorities in right order.
    client.state.prefixes = {};

    for (let i = 0; i < mode.length; ++i) {
      client.state.prefixes[prefixes[i]] = {
        priority: i,
      };
      client.state.chanmodes[mode[i]] = {
        type: "b", // RFC: modes coming from PREFIX should always be treated as type 'b'
        prefix: prefixes[i],
      };
    }
  });
});
