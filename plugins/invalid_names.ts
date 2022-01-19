import { createPlugin } from "../core/plugins.ts";
import nick from "./nick.ts";
import register from "./register.ts";
import registration from "./registration.ts";

interface InvalidNamesFeatures {
  options: {
    /** Auto resolve invalid names (for nick and username). */
    resolveInvalidNames?: boolean;
  };
}

const RESOLVE_INVALID_NAMES_ENABLED = false;

export default createPlugin(
  "invalid_names",
  [nick, register, registration],
)<InvalidNamesFeatures>((client, options) => {
  const enabled = options.resolveInvalidNames ?? RESOLVE_INVALID_NAMES_ENABLED;
  if (!enabled) return;

  const randomize = () => `_${Math.random().toString(36).slice(2, 9)}`;

  // Handles error replies related to names conflicts and resolves them.
  client.on("raw", (msg) => {
    switch (msg.command) {
      case "ERR_NICKNAMEINUSE": {
        const [, nick] = msg.params;
        client.nick(`${nick}_`);
        break;
      }
      case "ERR_ERRONEUSNICKNAME": {
        client.nick(randomize());
        break;
      }
      case "ERR_INVALIDUSERNAME": {
        const { user } = client.state;
        user.username = randomize();
        client.user(user.username, user.realname);
        break;
      }
    }
  });
});
