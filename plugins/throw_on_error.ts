import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export const throwOnError: Plugin = (client) => {
  client.on("raw", emitError);

  function emitError(msg: Raw) {
    if (msg.command !== "ERROR") {
      return;
    }

    client.emitError("read", msg.params.join(" "), emitError);
  }
};
