import { type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

interface ServerTimeFeatures {
  utils: {
    /** Extracts the server time from a message's tags, if present. */
    getServerTime: (msg: Raw) => Date | null;
  };
}

const plugin: Plugin<ServerTimeFeatures, AnyPlugins> = createPlugin(
  "server_time",
  [cap],
)((client) => {
  client.state.caps.requested.push("server-time");

  client.utils.getServerTime = (msg) => {
    const time = msg.tags?.time;
    if (!time) return null;
    const date = new Date(time);
    return isNaN(date.getTime()) ? null : date;
  };
});

export default plugin;
