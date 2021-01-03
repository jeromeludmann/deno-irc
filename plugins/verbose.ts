import { FatalError, Plugin } from "../core/client.ts";
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

  client.hooks.after("read", function logReceivedMessages(chunks) {
    if (chunks === null) return;
    console.info(dim("read"), dim(bold("chunks")), dim(JSON.stringify(chunks)));
  });

  client.hooks.after("send", async function logSentMessages(raw) {
    if (raw === null) return;
    console.info(dim("send"), dim(bold("raw")), dim(JSON.stringify(raw)));
  });

  client.hooks.before("send", async function logCommands(command, ...params) {
    console.info("send", bold(command), params);
  });

  client.hooks.before("emit", function logEvents(event, payload) {
    switch (event) {
      case "raw":
        break;

      case "error":
        const { type, name, message } = (payload as FatalError);
        console.info("emit", bold(event), { type, name, message });
        break;

      default:
        console.info("emit", bold(event), payload);
    }
  });

  client.hooks.set("state", function logStateChanges(state, key, value) {
    const prev = JSON.stringify(state[key]);
    const next = JSON.stringify(value);

    if (prev !== next) {
      console.info("diff", bold(key), red(`- ${prev}`));
      console.info("diff", bold(key), green(`+ ${next}`));
    }
  });
};
