import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickParams } from "./nick.ts";
import type { RegisterParams } from "./register.ts";
import { UserStateParams } from "./user_state.ts";

export interface InvalidNamesParams {
  options: {
    /** Auto resolve invalid names (for nick and username). */
    resolveInvalidNames?: boolean;
  };
}

function resolveInvalidNames(
  client: ExtendedClient<
    InvalidNamesParams & NickParams & RegisterParams & UserStateParams
  >,
) {
  if (!!client.options.resolveInvalidNames === false) {
    return;
  }

  const randomize = () => `_${Math.random().toString(36).slice(2, 9)}`;

  client.on("raw", (msg) => {
    switch (msg.command) {
      case "ERR_NICKNAMEINUSE": {
        // Adds trailing "_" to nick if it is already in use
        const [, nick] = msg.params;
        client.nick(`${nick}_`);
        break;
      }

      case "ERR_ERRONEUSNICKNAME": {
        // Uses a random nick if invalid
        client.nick(randomize());
        break;
      }

      case "ERR_INVALIDUSERNAME": {
        // Uses a random username if invalid
        client.state.username = randomize();
        client.user(client.state.username, client.state.realname);
        break;
      }
    }
  });
}

export const invalidNames = createPlugin(resolveInvalidNames);
