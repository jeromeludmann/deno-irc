import { type ClientError } from "../core/errors.ts";
import { createPlugin } from "../core/plugins.ts";
import { bold, dim, green, red } from "../deps.ts";

interface VerboseFeatures {
  options: {
    /** Prints informations to output. */
    verbose?: boolean;
  };
}

const DEFAULT_VERBOSE = false;

export default createPlugin(
  "verbose",
)<VerboseFeatures>((client, options) => {
  const enabled = options.verbose ?? DEFAULT_VERBOSE;
  if (!enabled) return;

  // Prints received messages.
  client.hooks.afterCall("read", (chunks) => {
    if (chunks !== null) {
      console.info(
        dim("read"),
        dim(bold("chunks")),
        dim(JSON.stringify(chunks)),
      );
    }
  });

  // Prints sent messages.
  client.hooks.afterCall("send", (raw) => {
    if (raw === null) return;
    console.info(dim("send"), dim(bold("raw")), dim(JSON.stringify(raw)));
  });

  // Prints sent commands.
  client.hooks.beforeCall("send", (command, ...params) => {
    console.info("send", bold(command), params);
  });

  // Prints emitted events.
  client.hooks.beforeCall("emit", (event, payload) => {
    switch (event) {
      case "raw": {
        break;
      }
      case "error": {
        const { type, name, message } = payload as ClientError;
        console.info("emit", bold(event), { type, name, message });
        break;
      }
      default: {
        console.info("emit", bold(event), payload);
      }
    }
  });

  // Prints state changes.
  client.hooks.beforeMutate("state", (state, key, value) => {
    const prev = JSON.stringify(state[key]);
    const next = JSON.stringify(value);
    const label = bold(key.toString());

    if (prev !== next) {
      console.info("diff", label, red(`- ${prev}`));
      console.info("diff", label, green(`+ ${next}`));
    }
  });
});
