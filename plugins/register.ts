import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface RegisterParams {
  events: {
    "register": Register;
  };
}

export interface Register {
  /** Nick who is registered. */
  nick: string;
  /** Text of the RPL_WELCOME. */
  text: string;
}

function events(client: ExtendedClient<RegisterParams>) {
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

export const register = createPlugin(events);
