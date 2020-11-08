import type { ExtendedClient, Raw } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";
import type { AnyError } from "../core/protocol.ts";

export interface ServerErrorParams {
  events: {
    "error:server": ServerError;
  };
}

type ServerCommand = "ERROR" | AnyError;

export class ServerError extends Error {
  command: ServerCommand;
  params: string[];

  constructor(msg: Raw) {
    super(`${msg.command}: ${msg.params.join(" ")}`);
    this.name = ServerError.name;
    this.command = msg.command as ServerCommand;
    this.params = msg.params;
  }
}

function events(client: ExtendedClient<ServerErrorParams>) {
  client.on("raw", (msg) => {
    const isServerError = (
      msg.command.startsWith("ERR_") ||
      msg.command === "ERROR"
    );

    if (!isServerError) {
      return;
    }

    client.emitError("error:server", new ServerError(msg));
  });
}

export const serverError = createPlugin(events);
