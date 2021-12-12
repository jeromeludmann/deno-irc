import { CoreParams, Plugin } from "../core/client.ts";
import { MockCoreClient } from "./client.ts";
import { mockConsole } from "./console.ts";
import { UnionToIntersection } from "./helpers.ts";
import { MockServer } from "./server.ts";

export interface MockOptions {
  withConnection?: boolean;
}

export async function mock<
  // deno-lint-ignore no-explicit-any
  TPlugins extends Plugin<any>[],
  TOptions extends
    & CoreParams["options"]
    & UnionToIntersection<Parameters<TPlugins[number]>[1]>,
>(plugins: TPlugins, options: TOptions, mockOptions: MockOptions = {}) {
  const { withConnection = true } = mockOptions;

  const console = mockConsole();

  const client = new MockCoreClient(plugins, options) as
    & MockCoreClient
    & UnionToIntersection<Parameters<TPlugins[number]>[0]>;

  const server = new MockServer(client);

  if (withConnection) {
    await client.connect("");
    server.receive();
  }

  return { client, server, console };
}
