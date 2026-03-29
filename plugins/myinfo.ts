import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** IRC server identification (host and version). */
export interface Server {
  host: string;
  version: string;
}

/** Parameters carried by a MYINFO event (server info and supported modes). */
export interface MyinfoEventParams {
  /** Server informations. */
  server: Server;

  /** Server user modes. */
  usermodes: string;

  /** Server channel modes. */
  chanmodes: string;
}

/** Emitted when the server sends its RPL_MYINFO with server capabilities. */
export type MyinfoEvent = Message<MyinfoEventParams>;

export interface MyinfoFeatures {
  events: {
    "myinfo": MyinfoEvent;
  };
  state: {
    server?: Server;
  };
}

const plugin: Plugin<MyinfoFeatures> = createPlugin("myinfo")((client) => {
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

export default plugin;
