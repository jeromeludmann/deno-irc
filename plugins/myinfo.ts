import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface Server {
  host: string;
  version: string;
}

export interface MyinfoEventParams {
  server: Server;
  modes: {
    user: string[];
    channel: string[];
  };
}

export type MyinfoEvent = Message<MyinfoEventParams>;

interface MyinfoFeatures {
  events: {
    "myinfo": MyinfoEvent;
  };
  state: {
    server?: Server;
  };
}

export default createPlugin("myinfo")<MyinfoFeatures>((client) => {
  // Emits 'myinfo' event.

  client.on("raw:rpl_myinfo", (msg) => {
    const { source, params: [, host, version, userModes, channelModes] } = msg;

    const user = userModes.split("");
    const channel = channelModes.split("");

    client.emit("myinfo", {
      source,
      params: {
        server: { host, version },
        modes: { user, channel },
      },
    });
  });

  // Sets 'server' state.

  client.on("myinfo", (msg) => {
    client.state.server = msg.params.server;
  });
});
