import { createPlugin, ExtendedClient, FatalError } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { bold, dim, green, red } from "../deps.ts";

export interface VerboseParams {
  options: {
    /** Prints informations to output. */
    verbose?: boolean;
  };
}

function options(client: ExtendedClient<VerboseParams>) {
  client.options.verbose ??= false;
}

function receivedMessages(client: ExtendedClient<VerboseParams>) {
  if (client.options.verbose === false) {
    return;
  }

  const emit = client.emit.bind(client);

  client.emit = (event, payload) => {
    if (event === "raw") {
      console.info(dim(`< ${(payload as Raw).raw}`));
    }

    return emit(event, payload);
  };
}

function sentMessages(client: ExtendedClient<VerboseParams>) {
  if (client.options.verbose === false) {
    return;
  }

  const send = client.send.bind(client);

  client.send = async (command, ...params) => {
    console.info(bold(command), params);

    const raw = await send(command, ...params);

    if (raw !== null) {
      console.info(dim(`> ${raw}`));
    }

    return raw;
  };
}

function emittedEvents(client: ExtendedClient<VerboseParams>) {
  if (client.options.verbose === false) {
    return;
  }

  const emit = client.emit.bind(client);

  client.emit = (event, payload) => {
    switch (event) {
      case "raw":
        break;
      case "error":
        const { name, type, message } = (payload as FatalError);
        console.info(bold(event), { name, type, message });
        break;
      default:
        console.info(bold(event), payload);
    }

    return emit(event, payload);
  };
}

function stateChanges(client: ExtendedClient<VerboseParams>) {
  if (client.options.verbose === false) {
    return;
  }

  (client as { state: unknown }).state = new Proxy(client.state, {
    set(state: Record<string, any>, key: string, value: unknown) {
      const prev = JSON.stringify(state[key]);
      const next = JSON.stringify(value);

      if (prev !== next) {
        console.info(red(`- ${bold(key)} ${prev}`));
        console.info(green(`+ ${bold(key)} ${next}`));
      }

      state[key] = value;
      return true;
    },
  });
}

export const verbose = createPlugin(
  options,
  receivedMessages,
  sentMessages,
  emittedEvents,
  stateChanges,
);
