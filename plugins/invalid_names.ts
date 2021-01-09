import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { NickParams } from "./nick.ts";
import { RegisterParams } from "./register.ts";
import { RegisterOnConnectParams } from "./register_on_connect.ts";

export interface InvalidNamesParams {
  options: {
    /** Auto resolve invalid names (for nick and username). */
    resolveInvalidNames?: boolean;
  };
}

const DEFAULT_RESOLVE_INVALID_NAMES = false;

export const invalidNames: Plugin<
  & NickParams
  & RegisterParams
  & RegisterOnConnectParams
  & InvalidNamesParams
> = (client, options) => {
  const enabled = options.resolveInvalidNames ?? DEFAULT_RESOLVE_INVALID_NAMES;

  if (!enabled) {
    return;
  }

  const resolveInvalidNames = (msg: Raw) => {
    switch (msg.command) {
      case "ERR_NICKNAMEINUSE":
        const [, nick] = msg.params;
        client.nick(`${nick}_`);
        break;

      case "ERR_ERRONEUSNICKNAME":
        client.nick(randomize());
        break;

      case "ERR_INVALIDUSERNAME":
        client.state.username = randomize();
        const { state: { username, realname } } = client;
        client.user(username, realname);
        break;
    }
  };

  client.on("raw", resolveInvalidNames);
};

function randomize() {
  return `_${Math.random().toString(36).slice(2, 9)}`;
}
