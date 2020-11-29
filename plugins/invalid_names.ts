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

export const invalidNames: Plugin<
  & NickParams
  & RegisterParams
  & RegisterOnConnectParams
  & InvalidNamesParams
> = (client, options) => {
  const enabled = options.resolveInvalidNames ?? false;

  if (enabled) {
    client.on("raw", resolveInvalidNames);
  }

  function resolveInvalidNames(msg: Raw) {
    switch (msg.command) {
      case "ERR_NICKNAMEINUSE":
        const [, nick] = msg.params;
        return client.nick(`${nick}_`);

      case "ERR_ERRONEUSNICKNAME":
        return client.nick(randomize());

      case "ERR_INVALIDUSERNAME":
        client.state.username = randomize();
        const { username, realname } = client.state;
        return client.user(username, realname);
    }
  }
};

function randomize() {
  return `_${Math.random().toString(36).slice(2, 9)}`;
}
