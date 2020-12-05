import { FatalError, Plugin } from "../core/client.ts";
import { Parser } from "../core/parsers.ts";
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

  hook(
    (client as unknown as { parser: Parser }).parser,
    "parseMessages",
    function logReceivedChunks(parseMessages, chunks) {
      const raw = chunks.split("\r\n");
      const last = raw.length - 1;

      if (raw[last] === "") {
        raw.pop();
      } else {
        raw[last] += bold(" // chunked");
      }

      for (const r of raw) {
        console.info(dim(`< ${r}`));
      }

      return parseMessages(chunks);
    },
  );

  hook(
    client,
    "send",
    async function logSentMessages(send, command, ...params) {
      console.info(bold(command), params);

      const raw = await send(command, ...params);

      if (raw !== null) {
        console.info(dim(`> ${raw}`));
      }

      return raw;
    },
  );

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
    set: function logStateChanges(
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
  TObject extends Object,
  TProp extends keyof TObject,
  TFunction extends TObject[TProp] extends (...args: any[]) => any
    ? TObject[TProp]
    : never,
>(
  client: TObject,
  prop: TProp,
  hook: (fn: TFunction, ...args: Parameters<TFunction>) => any,
): void {
  const fn = (client[prop] as any).bind(client);
  (client[prop] as unknown) = (...args: Parameters<TFunction>) =>
    hook(fn, ...args);
}
