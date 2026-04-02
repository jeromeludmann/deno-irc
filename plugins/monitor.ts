import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import isupport from "./isupport.ts";

/** Parameters carried by a monitor_online event. */
export interface MonitorOnlineEventParams {
  /** Nicks that are now online. */
  nicks: string[];
}

/** Parameters carried by a monitor_offline event. */
export interface MonitorOfflineEventParams {
  /** Nicks that are now offline. */
  nicks: string[];
}

/** Parameters carried by a monitor_list event. */
export interface MonitorListEventParams {
  /** Nicks currently being monitored. */
  nicks: string[];
}

/** Emitted when monitored nicks come online. */
export type MonitorOnlineEvent = Message<MonitorOnlineEventParams>;

/** Emitted when monitored nicks go offline. */
export type MonitorOfflineEvent = Message<MonitorOfflineEventParams>;

/** Emitted with the full list of monitored nicks. */
export type MonitorListEvent = Message<MonitorListEventParams>;

export interface MonitorFeatures {
  commands: {
    monitor: {
      /** Adds nicks to the monitor list. */
      add(nicks: string | string[]): void;
      /** Removes nicks from the monitor list. */
      remove(nicks: string | string[]): void;
      /** Requests the current monitor list from the server. */
      list(): void;
      /** Clears the entire monitor list. */
      clear(): void;
      /** Requests online status of all monitored nicks. */
      status(): void;
    };
  };
  events: {
    "monitor_online": MonitorOnlineEvent;
    "monitor_offline": MonitorOfflineEvent;
    "monitor_list": MonitorListEvent;
  };
  state: {
    monitorList: Set<string>;
    monitorLimit: number;
  };
}

const plugin: Plugin<MonitorFeatures, AnyPlugins> = createPlugin(
  "monitor",
  [isupport],
)((client) => {
  client.state.monitorList = new Set();
  client.state.monitorLimit = 0;

  // Track MONITOR limit from ISUPPORT.

  client.on("isupport:monitor", (msg) => {
    const value = msg.params.value;
    if (value) {
      client.state.monitorLimit = parseInt(value, 10) || 0;
    }
  });

  // Commands.

  client.monitor = {
    add(nicks) {
      const list = Array.isArray(nicks) ? nicks : [nicks];
      for (const nick of list) client.state.monitorList.add(nick);
      client.send("MONITOR", "+", list.join(","));
    },

    remove(nicks) {
      const list = Array.isArray(nicks) ? nicks : [nicks];
      for (const nick of list) client.state.monitorList.delete(nick);
      client.send("MONITOR", "-", list.join(","));
    },

    list() {
      client.send("MONITOR", "L");
    },

    clear() {
      client.state.monitorList.clear();
      client.send("MONITOR", "C");
    },

    status() {
      client.send("MONITOR", "S");
    },
  };

  // RPL_MONONLINE (730) — nicks are online.

  client.on("raw:rpl_mononline", (msg) => {
    const { source, params: [, targets] } = msg;
    const nicks = targets.split(",").map((t) => t.split("!")[0]);
    client.emit("monitor_online", { source, params: { nicks } });
  });

  // RPL_MONOFFLINE (731) — nicks are offline.

  client.on("raw:rpl_monoffline", (msg) => {
    const { source, params: [, targets] } = msg;
    const nicks = targets.split(",").map((t) => t.split("!")[0]);
    client.emit("monitor_offline", { source, params: { nicks } });
  });

  // RPL_MONLIST (732) + RPL_ENDOFMONLIST (733) — buffered list response.

  const listBuffer: string[] = [];

  client.on("raw:rpl_monlist", (msg) => {
    const [, targets] = msg.params;
    if (targets) {
      listBuffer.push(...targets.split(","));
    }
  });

  client.on("raw:rpl_endofmonlist", (msg) => {
    const { source } = msg;
    const nicks = [...listBuffer];
    listBuffer.length = 0;
    client.emit("monitor_list", { source, params: { nicks } });
  });

  // ERR_MONLISTFULL (734) — monitor list is full.

  client.on("raw:err_monlistfull", (msg) => {
    const [, limit] = msg.params;
    client.emitError(
      "read",
      `MONITOR list is full (limit: ${limit})`,
      client.monitor.add,
    );
  });

  // Clean up on disconnect.

  client.on("disconnected", () => {
    listBuffer.length = 0;
  });
});

export default plugin;
