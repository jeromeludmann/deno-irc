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

async function mockConnect<T extends Deno.ConnectOptions>(options: T) {
  const { hostname = "remote_host", port } = options;

  if (hostname === "bad_remote_host") {
    throw new Deno.errors.ConnectionRefused("Connection refused");
  }

  return new MockConn(hostname, port);
}
