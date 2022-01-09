import { type Plugin } from "../core/client.ts";
import { type Raw } from "../core/parsers.ts";

export interface Server {
  host: string;
  version: string;
}

export interface MyinfoEvent {
  server: Server;
  modes: {
    user: string[];
    channel: string[];
  };
}

export interface MyinfoParams {
  events: {
    "myinfo": MyinfoEvent;
  };
  state: {
    server?: Server;
  };
}

export const myinfoPlugin: Plugin<MyinfoParams> = (client) => {
  const emitMyinfoEvent = (msg: Raw) => {
    if (msg.command !== "RPL_MYINFO") {
      return;
    }

    const [, host, version, userModes, channelModes] = msg.params;

    const user = userModes.split("");
    const channel = channelModes.split("");

    client.emit("myinfo", {
      server: { host, version },
      modes: { user, channel },
    });
  };

  const setServerState = (msg: MyinfoEvent) => {
    client.state.server = msg.server;
  };

  client.on("raw", emitMyinfoEvent);
  client.on("myinfo", setServerState);
};
