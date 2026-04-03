import { MockClient, MockCoreClient } from "../testing/client.ts";
import { MockServer } from "../testing/server.ts";
import { MSG_PLAIN, SEND_80_PLAIN } from "./fixtures.ts";

// CoreClient (no plugins) ---

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
  async fn() {
    let count = 0;
    const done = new Promise<void>((resolve) => {
      const off = coreClient.on("raw:privmsg", () => {
        if (++count === 80) {
          off();
          resolve();
        }
      });
    });
    coreServer.send(SEND_80_PLAIN);
    await done;
  },
});

// Full Client (50+ plugins) ---

const fullClient = new MockClient({
  nick: "me",
  pingTimeout: false,
});
const fullServer = new MockServer(fullClient);
await fullClient.connect("");
fullServer.receive(); // drain registration messages

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
  async fn() {
    let count = 0;
    const done = new Promise<void>((resolve) => {
      const off = fullClient.on("raw:privmsg", () => {
        if (++count === 80) {
          off();
          resolve();
        }
      });
    });
    fullServer.send(SEND_80_PLAIN);
    await done;
  },
});
