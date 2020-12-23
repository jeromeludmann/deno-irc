import { FatalError, Plugin } from "../core/client.ts";
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

  let isPreviousChunked = false;

  client.hooks.after("read", function logReceivedMessages(chunks) {
    if (chunks === null) return null;

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
  });

  client.hooks.after("send", async function logSentMessages(raw) {
    if (raw === null) return;
    console.info(dim(`> ${raw}`));
  });

  client.hooks.before("send", async function logCommands(command, ...params) {
    console.info(bold(command), params);
  });

  client.hooks.before("emit", function logEvents(event, payload) {
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
  });

  client.hooks.set("state", function logStateChanges(state, key, value) {
    const prev = JSON.stringify(state[key]);
    const next = JSON.stringify(value);

    if (prev !== next) {
      console.info(red(`- ${bold(key)} ${prev}`));
      console.info(green(`+ ${bold(key)} ${next}`));
    }
  });
};
