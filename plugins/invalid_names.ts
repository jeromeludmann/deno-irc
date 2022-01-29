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

const RESOLVING_ENABLED = false;

export default createPlugin(
  "invalid_names",
  [nick, register, registration],
)<InvalidNamesFeatures>((client, options) => {
  const enabled = options.resolveInvalidNames ?? RESOLVING_ENABLED;
  if (!enabled) return;

  const randomize = () => `_${Math.random().toString(36).slice(2, 9)}`;

  // Handles error replies related to names conflicts and resolves them.

  client.on("raw:err_nicknameinuse", (msg) => {
    const [, nick] = msg.params;
    client.nick(`${nick}_`);
  });

  client.on("raw:err_erroneusnickname", () => {
    client.nick(randomize());
  });

  client.on("raw:err_invalidusername", () => {
    const { user } = client.state;
    user.username = randomize();
    client.user(user.username, user.realname);
  });
});
