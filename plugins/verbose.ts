import { FatalError, Plugin } from "../core/client.ts";
import { Parser } from "../core/parsers.ts";
import { bold, dim, green, red, reset } from "../deps.ts";

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

  const parser = (client as unknown as { parser: Parser }).parser;

  hook(parser, "parseMessages", logReceivedMessages);
  hook(client, "send", logSentMessages);
  hook(client, "emit", logEvents);
  (client.state as {}) = new Proxy(client.state, { set: logStateChanges });

  let isPreviousChunked = false;

  function logReceivedMessages(parseMessages: Function, chunks: string) {
    const raw = chunks.split("\r\n");

    if (isPreviousChunked) {
      raw[0] = bold("chunked...") + reset(dim(raw[0]));
    }

    const last = raw.length - 1;

    if (raw[last] === "") {
      raw.pop();
      isPreviousChunked = false;
    } else {
      raw[last] += bold("...chunked");
      isPreviousChunked = true;
    }

    for (const r of raw) {
      console.info(dim(`< ${r}`));
    }

    return parseMessages(chunks);
  }

  async function logSentMessages(
    send: Function,
    command: string,
    ...params: string[]
  ) {
    console.info(bold(command), params);

    const raw = await send(command, ...params);

    if (raw !== null) {
      console.info(dim(`> ${raw}`));
    }

    return raw;
  }

  function logEvents(emit: Function, event: string, payload: unknown) {
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
  }

  function logStateChanges(
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
  }
};

function hook<
  TObject extends Object,
  TMethodName extends keyof TObject,
  TMethod extends TObject[TMethodName] extends (...args: any[]) => any
    ? TObject[TMethodName]
    : never,
>(
  object: TObject,
  methodName: TMethodName,
  hook: (method: TMethod, ...args: Parameters<TMethod>) => any,
): void {
  const fn = (object[methodName] as any).bind(object);
  (object[methodName] as unknown) = (...args: Parameters<TMethod>) =>
    hook(fn, ...args);
}
