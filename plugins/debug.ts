import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface Options {
  debug?: boolean;
}

export interface DebugPluginParams {
  options: Options;
}

function options(client: ExtendedClient<DebugPluginParams>) {
  client.options.debug ??= false;
}

function rawMessages(client: ExtendedClient<DebugPluginParams>) {
  if (client.options.debug === false) {
    return;
  }

  client.on("raw", (msg) => {
    console.log("<<<", msg.raw);
  });

  const send = client.send.bind(client);
  client.send = (command, ...params) => {
    console.log(">>>", command, params);
    return send(command, ...params);
  };
}

function emittedEvents(client: ExtendedClient<DebugPluginParams>) {
  if (client.options.debug === false) {
    return;
  }

  const emit = client.emit.bind(client);

  client.emit = (name, payload) => {
    if (name !== "raw") {
      setTimeout(() => console.log("[*]", name, payload), 100);
    }
    return emit(name, payload);
  };
}

function stateChanges(client: ExtendedClient<DebugPluginParams>) {
  if (client.options.debug === false) {
    return;
  }

  let timeout: number | null;
  let oldState: Record<string, string> = {};

  client.on("raw", () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(() => {
      const newState = {} as Record<string, any>;

      for (const key in client.state) {
        newState[key] = JSON.stringify((client.state as any)[key]);

        if (oldState[key] !== newState[key]) {
          if (oldState[key] !== undefined) {
            console.log("[-]", key, JSON.parse(oldState[key]));
          }
          console.log("[+]", key, JSON.parse(newState[key]));
        }
      }

      oldState = newState;
    }, 100);
  });
}

export const plugin = createPlugin(
  options,
  rawMessages,
  emittedEvents,
  stateChanges,
);
