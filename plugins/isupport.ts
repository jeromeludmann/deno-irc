import { createPlugin } from "../core/plugins.ts";
import { type Message } from "../core/parsers.ts";

export interface IsupportEventParams {
  /** Value of the current ISUPPORT parameter. */
  value?: string;
}

export type IsupportEvent = Message<IsupportEventParams>;

type AnyIsupportParamKey = "USERMODES" | "CHANMODES" | "PREFIX" | "CHANTYPES";

interface IsupportFeatures {
  events: {
    [K in `isupport:${Lowercase<AnyIsupportParamKey>}`]: IsupportEvent;
  };
}

export default createPlugin("isupport")<IsupportFeatures>((client) => {
  // Emits 'isupport:*' events.

  client.on("raw:rpl_isupport", (msg) => {
    const { source, params: [, ...params] } = msg;
    params.pop(); // remove useless trailing "are supported by this server"

    for (const param of params) {
      const [key, value = undefined] = param.split("=");

      // ignore unavailable feature
      if (key.startsWith("-")) {
        continue;
      }

      client.emit(
        `isupport:${key.toLowerCase() as Lowercase<AnyIsupportParamKey>}`,
        { source, params: { value } },
      );
    }
  });
});
