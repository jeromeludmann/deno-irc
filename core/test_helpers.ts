import * as Core from "./client.ts";
import { TestServer } from "./test_server.ts";

export function arrange<
  TPlugins extends Core.Plugin<any>[],
  TOptions extends
    & Core.Params["options"]
    & UnionToIntersection<Parameters<TPlugins[number]>[0]["options"]>,
>(plugins: TPlugins, options: TOptions) {
  const server = new TestServer();

  class Client extends Core.Client<any> {
    constructor(options: TOptions) {
      super(options, plugins);
    }
  }

  const client = new Client(options) as
    & Client
    & UnionToIntersection<Parameters<TPlugins[number]>[0]>;

  const sanitize = async () => {
    await client.disconnect();
    await server.close();
  };

  return { server, client, sanitize };
}

// Stolen from https://stackoverflow.com/a/50375286/13457771
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends
  ((k: infer I) => void) ? I : never;
