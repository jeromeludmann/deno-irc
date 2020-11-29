import { CoreClient, FatalError, Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { bold, dim, green, red } from "../deps.ts";

export interface VerboseParams {
  options: {
    /** Prints informations to output. */
    verbose?: boolean;
  };
}

export const verbose: Plugin<VerboseParams> = (client, options) => {
  const enabled = options.verbose ?? false;

  if (!enabled) {
    return;
  }

  hook(client, "emit", function logReceivedMsg(emit, event, payload) {
    if (event === "raw") {
      console.info(dim(`< ${(payload as Raw).raw}`));
    }

    return emit(event, payload);
  });

  hook(client, "send", async function logSentMsg(send, command, ...params) {
    console.info(bold(command), params);

    const raw = await send(command, ...params);

    if (raw !== null) {
      console.info(dim(`> ${raw}`));
    }

    return raw;
  });

  hook(client, "emit", function logEvents(emit, event, payload) {
    switch (event) {
      case "raw":
        break;

      case "error":
        const { type, name, message } = (payload as FatalError);
        console.info(bold(red(event)), { type, name, message });
        break;

      default:
        console.info(bold(event), payload);
    }

    return emit(event, payload);
  });

  (client.state as unknown) = new Proxy(client.state, {
    set: function logState(
      state: Record<string, any>,
      key: string,
      value: unknown,
    ) {
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
};

function hook<
  TClient extends CoreClient,
  TProp extends keyof TClient,
  TFunction extends TClient[TProp] extends (...args: any[]) => any
    ? TClient[TProp]
    : never,
>(
  client: TClient,
  prop: TProp,
  hook: (fn: TFunction, ...args: Parameters<TFunction>) => any,
): void {
  const fn = (client[prop] as any).bind(client);
  (client[prop] as unknown) = (...args: Parameters<TFunction>) =>
    hook(fn, ...args);
}
