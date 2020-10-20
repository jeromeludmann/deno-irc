import { ModuleError } from "../core/errors.ts";
import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

// Note: "error" event is already defined in the core part

export class ServerError extends ModuleError {
  name = ServerError.name;
}

function emitServerError(client: ExtendedClient) {
  client.on("raw", (msg) => {
    if (msg.command !== "ERROR") {
      return;
    }

    const [message] = msg.params;
    client.emit("error", new ServerError(message));
  });
}

export const plugin = createPlugin(emitServerError);
