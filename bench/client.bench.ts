import { MockClient, MockCoreClient } from "../testing/client.ts";
import { MockServer } from "../testing/server.ts";
import type { CoreFeatures } from "../core/client.ts";
import type { EventEmitter } from "../core/events.ts";
import { MSG_PLAIN, SEND_80_PLAIN } from "./fixtures.ts";

function benchBatch<TEvents extends CoreFeatures["events"]>(
  client: EventEmitter<TEvents>,
  server: MockServer,
): () => Promise<void> {
  return async () => {
    let count = 0;
    const done = new Promise<void>((resolve) => {
      const off = client.on("raw:privmsg", () => {
        if (++count === 80) {
          off();
          resolve();
        }
      });
    });
    server.send(SEND_80_PLAIN);
    await done;
  };
}

// CoreClient (no plugins)

const coreClient = new MockCoreClient([], {});
const coreServer = new MockServer(coreClient);
await coreClient.connect("");

Deno.bench({
  name: "pipeline: single PRIVMSG (CoreClient)",
  group: "pipeline-single",
  baseline: true,
  async fn() {
    const p = coreClient.once("raw:privmsg");
    coreServer.send(MSG_PLAIN);
    await p;
  },
});

Deno.bench({
  name: "pipeline: 80 PRIVMSG batch (CoreClient)",
  group: "pipeline-batch",
  baseline: true,
  fn: benchBatch(coreClient, coreServer),
});

// Full Client (50+ plugins)

const fullClient = new MockClient({
  nick: "me",
  pingTimeout: false,
});
const fullServer = new MockServer(fullClient);
await fullClient.connect("");
fullServer.receive();

Deno.bench({
  name: "pipeline: single PRIVMSG (full Client)",
  group: "pipeline-single",
  async fn() {
    const p = fullClient.once("raw:privmsg");
    fullServer.send(MSG_PLAIN);
    await p;
  },
});

Deno.bench({
  name: "pipeline: 80 PRIVMSG batch (full Client)",
  group: "pipeline-batch",
  fn: benchBatch(fullClient, fullServer),
});
