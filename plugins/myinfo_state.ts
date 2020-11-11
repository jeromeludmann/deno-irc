import { createPlugin, ExtendedClient } from "../core/client.ts";
import { MyinfoParams } from "./myinfo.ts";

export interface MyinfoStateParams {
  state: {
    serverHost: string;
    serverVersion: string;
    availableUserModes: string[];
    availableChannelModes: string[];
  };
}

function state(client: ExtendedClient<MyinfoStateParams & MyinfoParams>) {
  client.state.serverHost = "";
  client.state.serverVersion = "";
  client.state.availableUserModes = [];
  client.state.availableChannelModes = [];

  client.on("myinfo", (msg) => {
    client.state.serverHost = msg.serverHost;
    client.state.serverVersion = msg.serverVersion;
    client.state.availableUserModes = msg.availableUserModes;
    client.state.availableChannelModes = msg.availableChannelModes;
  });
}

export const myinfoState = createPlugin(state);
