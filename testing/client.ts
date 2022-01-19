import { CoreClient } from "../core/client.ts";
import { Client } from "../client.ts";
import { MockConn } from "./conn.ts";

export function mockConnect<T extends Deno.ConnectOptions>(options: T) {
  const { hostname = "remote_host", port } = options;

  if (hostname === "bad_remote_host") {
    return Promise.reject("Connection refused");
  }

  return Promise.resolve(new MockConn(hostname, port));
}

export class MockCoreClient extends CoreClient {
  protected connectImpl = {
    withTls: mockConnect,
    noTls: mockConnect,
  };
  readonly conn: MockConn | null = null;
}

export class MockClient extends Client {
  protected connectImpl = {
    withTls: mockConnect,
    noTls: mockConnect,
  };
  readonly conn: MockConn | null = null;
}
