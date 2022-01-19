import { ClientOptions } from "../client.ts";
import { MockClient } from "./client.ts";
import { mockConsole } from "./console.ts";
import { MockServer } from "./server.ts";

export interface MockOptions {
  withConnection?: boolean;
}

export async function mock(
  options: Partial<ClientOptions> = {},
  mockOptions: MockOptions = {},
) {
  const { withConnection = true } = mockOptions;

  const console = mockConsole();

  const client = new MockClient({ nick: "me", ...options });
  const server = new MockServer(client);

  if (withConnection) {
    await client.connect("");
    server.receive();
  }

  return { client, server, console };
}
