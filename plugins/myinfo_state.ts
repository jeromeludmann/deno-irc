import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { MyinfoParams } from "./myinfo.ts";

export interface MyinfoStateParams {
  state: {
    serverHost: string;
    serverVersion: string;
    availableUserModes: string[];
    availableChannelModes: string[];
  };
}

function state(
  client: ExtendedClient<MyinfoStateParams & MyinfoParams>,
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

export const myinfoState = createPlugin(state);
