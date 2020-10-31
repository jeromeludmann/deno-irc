import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { MyinfoPluginParams } from "./myinfo.ts";

export interface State {
  serverHost: string;
  serverVersion: string;
  availableUserModes: string[];
  availableChannelModes: string[];
}

export interface MyinfoStatePluginParams {
  state: State;
}

function state(
  client: ExtendedClient<MyinfoStatePluginParams & MyinfoPluginParams>,
) {
  client.state = {
    serverHost: "",
    serverVersion: "",
    availableUserModes: [],
    availableChannelModes: [],
  };

  client.on("myinfo", (msg) => {
    client.state = { ...client.state, ...msg };
  });
}

export const plugin = createPlugin(state);
