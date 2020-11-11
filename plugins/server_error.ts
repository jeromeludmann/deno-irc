import { createPlugin, ExtendedClient } from "../core/client.ts";

function events(client: ExtendedClient) {
  client.on("raw", (msg) => {
    if (msg.command !== "ERROR") {
      return;
    }

    throw new Error(msg.params.join(" "));
  });
}

export const serverError = createPlugin(events);
