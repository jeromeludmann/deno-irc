import { createPlugin, ExtendedClient } from "../core/client.ts";

export interface MyinfoParams {
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

function events(client: ExtendedClient<MyinfoParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "RPL_MYINFO") {
      return;
    }

    const [nick, host, version, userModes, channelModes] = msg.params;
    return client.emit("myinfo", {
      serverHost: host,
      serverVersion: version,
      availableUserModes: userModes.split(""),
      availableChannelModes: channelModes.split(""),
    });
  });
}

export const myinfo = createPlugin(events);
