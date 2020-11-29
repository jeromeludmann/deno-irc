import { FatalError, Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export const throwOnError: Plugin = (client) => {
  client.on("raw", emitError);

  function emitError(msg: Raw) {
    if (msg.command !== "ERROR") {
      return;
    }

    const message = msg.params.join(" ");
    client.emit("error", new FatalError("read", message));
  }
};
