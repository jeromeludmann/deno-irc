import { createPlugin } from "../core/plugins.ts";
import myinfo from "./myinfo.ts";
import isupport from "./isupport.ts";

export interface Modes {
  [mode: string]: { type: string };
}

interface UsermodesFeatures {
  state: {
    usermodes: Modes;
  };
}

export default createPlugin(
  "usermodes",
  [myinfo, isupport],
)<UsermodesFeatures>((client) => {
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
