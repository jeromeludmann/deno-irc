import { createPlugin, type Plugin } from "../core/plugins.ts";
import { type Message } from "../core/parsers.ts";

/** Parameters carried by an ISUPPORT event. */
export interface IsupportEventParams {
  /** Value of the current ISUPPORT parameter. */
  value?: string;
}

/** Emitted for each ISUPPORT parameter advertised by the server. */
export type IsupportEvent = Message<IsupportEventParams>;

type AnyIsupportParamKey = "USERMODES" | "CHANMODES" | "PREFIX" | "CHANTYPES";

interface IsupportFeatures {
  events: {
    [K in `isupport:${Lowercase<AnyIsupportParamKey>}`]: IsupportEvent;
  };
}

const plugin: Plugin<IsupportFeatures> = createPlugin("isupport")((client) => {
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

export default plugin;
