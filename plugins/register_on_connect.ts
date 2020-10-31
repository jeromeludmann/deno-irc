import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickParams } from "./nick.ts";
import type { RegisterParams } from "./register.ts";

export interface RegisterOnConnectParams {
  options: {
    /** The nick used to register the client to the server. */
    nick: string;
    /** The username used to register the client to the server. */
    username?: string;
    /** The realname used to register the client to the server. */
    realname?: string;
    /** The password used to connect the client to the server. */
    password?: string;
  };
}

// TODO Move collision feature to dedicated plugin
//
// The following function is confusing and should be rewritten. This could be
// split in a separate feature, allowing the end user to enable or disable the
// behavior.

function autoRegister(
  client: ExtendedClient<
    RegisterOnConnectParams & RegisterParams & NickParams
  >,
) {
  const {
    nick,
    username = nick,
    realname = nick,
    password,
  } = client.options;

  const user = (username: string, realname: string) => {
    client.send("USER", username, "0", "*", realname);
  };

  const pass = client.send.bind(client, "PASS");

  const generateRandomName = () => `_${Math.random().toString(36).slice(2, 9)}`;

  const runRegistrationSequence = () => {
    // Manages nick/username issues on registration
    const removeNickIssuesListener = client.on("raw", (msg) => {
      switch (msg.command) {
        case "ERR_NICKNAMEINUSE": {
          // Adds trailing "_" to nick if it is already in use
          const [, nick] = msg.params;
          client.nick(`${nick}_`);
          break;
        }

        case "ERR_ERRONEUSNICKNAME": {
          // Tries to use a random nick if it contains bad characters
          client.nick(generateRandomName());
          break;
        }

        case "ERR_INVALIDUSERNAME": {
          // Tries to use a random username if it contains bad characters
          user(generateRandomName(), realname);
          break;
        }
      }
    });
    client.once("register", removeNickIssuesListener);

    // Runs sequence
    if (password !== undefined) {
      pass(password);
    }
    client.nick(nick);
    user(username, realname);
  };

  client.on("connected", () => {
    runRegistrationSequence();
  });

  client.on("raw", (msg) => {
    if (msg.command === "ERR_NOTREGISTERED") {
      runRegistrationSequence();
    }
  });
}

export const registerOnConnect = createPlugin(autoRegister);
