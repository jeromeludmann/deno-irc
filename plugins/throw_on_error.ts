import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export const throwOnError: Plugin = (client) => {
  const emitError = (msg: Raw) => {
    if (msg.command !== "ERROR") {
      return;
    }

    const error = msg.params.join(" ");
    client.emitError("read", error, emitError);
  };

  client.on("raw", emitError);
};
