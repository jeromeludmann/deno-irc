import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import myinfo from "./myinfo.ts";
import isupport from "./isupport.ts";

/** Map of user mode characters to their type classification. */
export interface Modes {
  [mode: string]: { type: string };
}

export interface UsermodesFeatures {
  state: {
    usermodes: Modes;
  };
}

const plugin: Plugin<UsermodesFeatures, AnyPlugins> = createPlugin(
  "usermodes",
  [myinfo, isupport],
)((client) => {
  // Default 'usermodes' state.

  client.state.usermodes = {
    "a": { type: "d" }, // RFC2812: AWAY
    "i": { type: "d" }, // RFC1459: INVISIBLE
    "o": { type: "d" }, // RFC1459: GLOBAL_OPERATOR
    "O": { type: "d" }, // RFC2812: LOCAL_OPERATOR
    "r": { type: "d" }, // RFC2812: RESTRICTED
    "s": { type: "d" }, // RFC1459: SERVER_NOTICES
    "w": { type: "d" }, // RFC1459: WALLOPS
  };
});

export default plugin;
