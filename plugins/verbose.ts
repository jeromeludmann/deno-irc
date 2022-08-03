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

  // deno-lint-ignore no-explicit-any
  client.hooks.afterCall("read" as any, (chunks: string | null) => {
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
    if (raw !== null) {
      console.info(dim("send"), dim(bold("raw")), dim(JSON.stringify(raw)));
    }
  });

  // Prints sent commands.

  client.hooks.beforeCall("send", (command, ...params) => {
    console.info("send", bold(command), params);
  });

  // Prints emitted events.

  client.hooks.beforeCall("emit", (event, payload) => {
    if (event.startsWith("raw")) {
      return;
    }
    if (event === "error") {
      const { type, name, message } = payload as ClientError;
      payload = { type, name, message };
    }
    console.info("emit", bold(event), payload);
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
