import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface MyinfoParams {
  events: {
    "myinfo": Myinfo;
  };
}

export interface Myinfo {
  /** Nick used on the server. */
  nick: string;
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
      nick,
      serverHost: host,
      serverVersion: version,
      availableUserModes: userModes.split(""),
      availableChannelModes: channelModes.split(""),
    });
  });
}

export const myinfo = createPlugin(events);
