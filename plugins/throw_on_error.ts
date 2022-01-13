import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export const throwOnErrorPlugin: Plugin = (client) => {
  const emitError = (msg: Raw) => {
    if (msg.command !== "ERROR") {
      return;
    }

    const { command, params } = msg;
    const message = command + ": " + params.join(": ");

    client.emitError("read", message, emitError);
  };

  client.on("raw", emitError);
};
