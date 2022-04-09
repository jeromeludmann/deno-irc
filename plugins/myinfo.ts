import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface Server {
  host: string;
  version: string;
}

export interface MyinfoEventParams {
  /** Server informations. */
  server: Server;

  /** Server user modes. */
  usermodes: string;

  /** Server channel modes. */
  chanmodes: string;
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
    const { source, params } = msg;
    const [, host, version, usermodes, chanmodes] = params;

    client.emit("myinfo", {
      source,
      params: {
        server: { host, version },
        usermodes,
        chanmodes,
      },
    });
  });

  // Sets 'server' state.

  client.on("myinfo", (msg) => {
    client.state.server = msg.params.server;
  });
});
