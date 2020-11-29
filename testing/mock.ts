import { ClientOptions } from "../client.ts";
import { CoreParams, Plugin } from "../core/client.ts";
import { MockClient, MockCoreClient } from "./client.ts";
import { mockConsole } from "./console.ts";
import { UnionToIntersection } from "./helpers.ts";
import { MockServer } from "./server.ts";

export interface MockOptions {
  withConnection?: boolean;
}

export async function mock<
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

export function mockAll(options: ClientOptions) {
  const console = mockConsole();
  const client = new MockClient(options);
  const server = new MockServer(client);
  return { client, server, console };
}
