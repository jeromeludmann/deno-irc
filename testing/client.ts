import { Client } from "../client.ts";
import { CoreClient } from "../core/client.ts";
import { MockConn } from "./conn.ts";

export class MockCoreClient extends CoreClient {
  protected connectImpl = mockConnect;
  readonly conn: MockConn | null = null;
}

export class MockClient extends Client {
  protected connectImpl = mockConnect;
}

function mockConnect<T extends Deno.ConnectOptions>(options: T) {
  const { hostname = "remote_host", port } = options;

  if (hostname === "bad_remote_host") {
    return Promise.reject("Connection refused");
  }

  return Promise.resolve(new MockConn(hostname, port));
}
