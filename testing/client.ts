import { CoreClient } from "../core/client.ts";
import { Client } from "../client.ts";
import { MockConn } from "./conn.ts";
import type { Runtime } from "../runtime/types.ts";

/** Error recognized as "silent" by the mock runtime. */
export class SilentTestError extends Error {
  constructor() {
    super("silent test error");
  }
}

const mockRuntime: Runtime = {
  connect(opts) {
    if (opts.hostname === "bad_remote_host") {
      return Promise.reject("Connection refused");
    }
    return Promise.resolve(new MockConn(opts.hostname, opts.port));
  },
  connectTls(opts) {
    if (opts.hostname === "bad_remote_host") {
      return Promise.reject("Connection refused");
    }
    return Promise.resolve(new MockConn(opts.hostname, opts.port));
  },
  readTextFileSync(): string {
    return "";
  },
  isSilentError(error: unknown): boolean {
    return error instanceof SilentTestError;
  },
};

export class MockCoreClient extends CoreClient {
  protected override runtime = mockRuntime;
  override readonly conn: MockConn | null = null;
}

export class MockClient extends Client {
  protected override runtime = mockRuntime;
  override readonly conn: MockConn | null = null;
}
