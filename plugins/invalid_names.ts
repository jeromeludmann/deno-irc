import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { NickParams } from "./nick.ts";
import { RegisterParams } from "./register.ts";
import { RegistrationParams } from "./registration.ts";

export interface InvalidNamesParams {
  options: {
    /** Auto resolve invalid names (for nick and username). */
    resolveInvalidNames?: boolean;
  };
}

const DEFAULT_RESOLVE_INVALID_NAMES = false;

export const invalidNamesPlugin: Plugin<
  & NickParams
  & RegisterParams
  & RegistrationParams
  & InvalidNamesParams
> = (client, options) => {
  const randomize = () => `_${Math.random().toString(36).slice(2, 9)}`;

  const resolveInvalidNames = (msg: Raw) => {
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
        client.state.username = randomize();
        const { state: { username, realname } } = client;
        client.user(username, realname);
        break;
      }
    }
  };

  const enabled = options.resolveInvalidNames ?? DEFAULT_RESOLVE_INVALID_NAMES;
  if (!enabled) return;

  client.on("raw", resolveInvalidNames);
};
