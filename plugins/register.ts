import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { NickPluginParams } from "./nick.ts";

export interface Options {
  username?: string;
  realname?: string;
  password?: string;
}

export interface Events {
  "register": Register;
  "myinfo": Myinfo;
}

export interface Register {
  nick: string;
  text: string;
}

export interface Myinfo {
  nick: string;
  serverHost: string;
  serverVersion: string;
  availableUserModes: string[];
  availableChannelModes: string[];
}

export interface State {
  serverHost: string;
  serverVersion: string;
  availableUserModes: string[];
  availableChannelModes: string[];
}

export interface RegisterPluginParams {
  options: Options;
  events: Events;
  state: State;
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

      case "RPL_MYINFO": {
        const [nick, host, version, userModes, channelModes] = msg.params;
        return client.emit("myinfo", {
          nick,
          serverHost: host,
          serverVersion: version,
          availableUserModes: userModes.split(""),
          availableChannelModes: channelModes.split(""),
        });
      }
    }
  });
}

function state(
  client: ExtendedClient<RegisterPluginParams & NickPluginParams>,
) {
  client.on("register", (msg) => {
    client.state.nick = msg.nick;
  });

  client.on("myinfo", (msg) => {
    client.state.serverHost = msg.serverHost;
    client.state.serverVersion = msg.serverVersion;
    client.state.availableUserModes = msg.availableUserModes;
    client.state.availableChannelModes = msg.availableChannelModes;
  });
}

// TODO Move collision feature to dedicated plugin
//
// The following function is confusing and should be rewritten. This could be
// split in a separate feature, allowing the end user to enable or disable the
// behavior.

function registration(
  client: ExtendedClient<RegisterPluginParams & NickPluginParams>,
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

export const plugin = createPlugin(events, state, registration);
