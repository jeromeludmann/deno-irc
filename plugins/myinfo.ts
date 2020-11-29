import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export interface MyinfoParams {
  state: {
    serverHost: string;
    serverVersion: string;
    availableUserModes: string[];
    availableChannelModes: string[];
  };

  events: {
    "myinfo": Myinfo;
  };
}

export interface Myinfo {
  /** Hostname of the server. */
  serverHost: string;

  /** Version of the server. */
  serverVersion: string;

  /** Available user modes on the server. */
  availableUserModes: string[];

  /** Available channel modes on the server. */
  availableChannelModes: string[];
}

export const myinfo: Plugin<MyinfoParams> = (client) => {
  const { state } = client;

  state.serverHost = "";
  state.serverVersion = "";
  state.availableUserModes = [];
  state.availableChannelModes = [];

  client.on("raw", emitMyinfo);
  client.on("myinfo", setMyinfoState);

  function emitMyinfo(msg: Raw) {
    if (msg.command !== "RPL_MYINFO") {
      return;
    }

    const [, host, version, userModes, channelModes] = msg.params;

    return client.emit("myinfo", {
      serverHost: host,
      serverVersion: version,
      availableUserModes: userModes.split(""),
      availableChannelModes: channelModes.split(""),
    });
  }

  function setMyinfoState(msg: Myinfo) {
    const { state } = client;

    state.serverHost = msg.serverHost;
    state.serverVersion = msg.serverVersion;
    state.availableUserModes = msg.availableUserModes;
    state.availableChannelModes = msg.availableChannelModes;
  }
};
