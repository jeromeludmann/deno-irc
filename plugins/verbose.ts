import { Plugin } from "../core/client.ts";
import { ClientError } from "../core/errors.ts";
import { AnyCommand } from "../core/protocol.ts";
import { bold, dim, green, red } from "../deps.ts";

export interface VerboseParams {
  options: {
    /** Prints informations to output. */
    verbose?: boolean;
  };
}

const DEFAULT_VERBOSE = false;

export const verbose: Plugin<VerboseParams> = (client, options) => {
  const enabled = options.verbose ?? DEFAULT_VERBOSE;

  if (!enabled) {
    return;
  }

  const logReceivedMessages = (chunks: string | null) => {
    if (chunks === null) return;
    console.info(dim("read"), dim(bold("chunks")), dim(JSON.stringify(chunks)));
  };

  const logSentMessages = (raw: string | null) => {
    if (raw === null) return;
    console.info(dim("send"), dim(bold("raw")), dim(JSON.stringify(raw)));
  };

  const logCommands = (command: AnyCommand, ...params: string[]) => {
    console.info("send", bold(command), params);
  };

  const logEvents = (event: string, payload: unknown) => {
    switch (event) {
      case "raw":
        break;

      case "error":
        const { type, name, message } = (payload as ClientError);
        console.info("emit", bold(event), { type, name, message });
        break;

      default:
        console.info("emit", bold(event), payload);
    }
  };

  const logStateChanges = <T>(state: T, key: keyof T, value: unknown) => {
    const prev = JSON.stringify(state[key]);
    const next = JSON.stringify(value);
    const label = bold(key.toString());

    if (prev !== next) {
      console.info("diff", label, red(`- ${prev}`));
      console.info("diff", label, green(`+ ${next}`));
    }
  };

  client.hooks.afterCall("read", logReceivedMessages);
  client.hooks.afterCall("send", logSentMessages);
  client.hooks.beforeCall("send", logCommands);
  client.hooks.beforeCall("emit", logEvents);
  client.hooks.beforeMutate("state", logStateChanges);
};
