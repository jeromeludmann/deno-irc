// deno-lint-ignore-file no-explicit-any
import { type ClientError } from "../core/errors.ts";
import { createPlugin } from "../core/plugins.ts";
import { type AnyRawCommand } from "../core/protocol.ts";
import { bold, dim, green, red } from "../deps.ts";

interface RawLogPayload {
  type: "raw_input" | "raw_output";
  msg: string | null;
}

interface EventLogPayload {
  type: "event";
  event: string;
  payload: any;
}

interface CommandLogPayload {
  type: "command";
  command: AnyRawCommand;
  params: (string | undefined)[];
}

interface StateLogPayload {
  type: "state";
  state: any;
  key: string;
  value: any;
}

type LogPayload =
  | RawLogPayload
  | EventLogPayload
  | CommandLogPayload
  | StateLogPayload;

type LoggerImpl = (payload: LogPayload) => void;

interface VerboseFeatures {
  options: {
    /** Prints informations to output.
     *
     * - `"raw"`: received and sent raw IRC messages
     * - `"formatted"`: formatted events, commands and state changes
     * - `(payload: LogPayload) => void`: a custom logger implementation */
    verbose?: "raw" | "formatted" | LoggerImpl;
  };
}

// Default logger used with "raw" verbose value
const defaultRawLogger: LoggerImpl = (payload) => {
  switch (payload.type) {
    case "raw_input": { // Prints received raw messages
      if (payload.msg !== null) {
        console.info(
          dim("read"),
          dim(bold("chunks")),
          dim(JSON.stringify(payload.msg)),
        );
      }
      break;
    }

    case "raw_output": { // Prints sent raw messages
      if (payload.msg !== null) {
        console.info(
          dim("send"),
          dim(bold("raw")),
          dim(JSON.stringify(payload.msg)),
        );
      }
      break;
    }
  }
};

// Default logger used with "formatted" verbose value
const defaultFormattedLogger: LoggerImpl = (payload) => {
  switch (payload.type) {
    case "event": { // Prints emitted events
      if (payload.event.startsWith("raw")) {
        return;
      }
      if (payload.event === "error") {
        const { type, name, message } = payload.payload as ClientError;
        payload.payload = { type, name, message };
      }
      console.info("emit", bold(payload.event), payload.payload);
      break;
    }

    case "command": { // Prints sent commands
      console.info("send", bold(payload.command), payload.params);
      break;
    }

    case "state": { // Prints state changes
      const prev = JSON.stringify(payload.state[payload.key]);
      const next = JSON.stringify(payload.value);
      const label = bold(payload.key.toString());

      if (prev !== next) {
        console.info("diff", label, red(`- ${prev}`));
        console.info("diff", label, green(`+ ${next}`));
      }
      break;
    }
  }
};

export default createPlugin(
  "verbose",
)<VerboseFeatures>((client, options) => {
  const getLoggerImpl = () => {
    switch (options.verbose) {
      case "raw":
        return defaultRawLogger;
      case "formatted":
        return defaultFormattedLogger;
      case undefined:
        return undefined;
      default:
        return options.verbose;
    }
  };

  const loggerImpl = getLoggerImpl();
  if (!loggerImpl) return;

  client.hooks.afterCall("read" as any, (chunks: string | null) => {
    loggerImpl({ type: "raw_input", msg: chunks });
  });

  client.hooks.afterCall("send", (raw) => {
    loggerImpl({ type: "raw_output", msg: raw });
  });

  client.hooks.beforeCall("send", (command, ...params) => {
    loggerImpl({ type: "command", command, params });
  });

  client.hooks.beforeCall("emit", (event, payload) => {
    loggerImpl({ type: "event", event, payload });
  });

  client.hooks.beforeMutate("state", (state, key, value) => {
    loggerImpl({ type: "state", state, key, value });
  });
});
