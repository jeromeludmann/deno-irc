import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface Events {
  "register": Register;
}

export interface Register {
  /** Nick who is registered. */
  nick: string;
  /** Text of the RPL_WELCOME. */
  text: string;
}

export interface RegisterPluginParams {
  events: Events;
}

function events(client: ExtendedClient<RegisterPluginParams>) {
  client.on("raw", (msg) => {
    switch (msg.command) {
      case "RPL_WELCOME": {
        const [nick, text] = msg.params;
        return client.emit("register", {
          nick,
          text,
        });
      }
    }
  });
}

export const plugin = createPlugin(events);
