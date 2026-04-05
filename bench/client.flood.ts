import { MockClient, MockCoreClient } from "../testing/client.ts";
import { MockServer } from "../testing/server.ts";
import type { CoreFeatures } from "../core/client.ts";
import type { EventEmitter } from "../core/events.ts";
import { MSG_PLAIN } from "./fixtures.ts";

const DURATION_SEC = 30;
const REPORT_INTERVAL_MS = 1000;

interface Sample {
  elapsed: number;
  msgsPerSec: number;
  heapMB: number;
}

async function runFlood<TEvents extends CoreFeatures["events"]>(
  label: string,
  client: EventEmitter<TEvents>,
  server: MockServer,
) {
  const samples: Sample[] = [];
  let totalCount = 0;
  let intervalCount = 0;
  let running = true;

  const startHeap = Deno.memoryUsage().heapUsed;
  const start = performance.now();
  let lastReport = start;

  const YIELD_EVERY = 1000;
  let batchCount = 0;

  client.on("raw:privmsg", () => {
    totalCount++;
    intervalCount++;
    if (!running) return;
    batchCount++;
    if (batchCount >= YIELD_EVERY) {
      // Yield to macrotask queue so setTimeout/setInterval can fire
      batchCount = 0;
      setTimeout(() => server.send(MSG_PLAIN), 0);
    } else {
      queueMicrotask(() => server.send(MSG_PLAIN));
    }
  });

  // Start the chain
  server.send(MSG_PLAIN);

  // Report loop
  const interval = setInterval(() => {
    const now = performance.now();
    const dt = (now - lastReport) / 1000;
    const msgsPerSec = Math.round(intervalCount / dt);
    const heapMB = Deno.memoryUsage().heapUsed / 1024 / 1024;

    samples.push({
      elapsed: Math.round((now - start) / 1000),
      msgsPerSec,
      heapMB: Math.round(heapMB * 10) / 10,
    });

    intervalCount = 0;
    lastReport = now;
  }, REPORT_INTERVAL_MS);

  // Run for DURATION_SEC
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      running = false;
      clearInterval(interval);
      resolve();
    }, DURATION_SEC * 1000);
  });

  // Wait for remaining in-flight messages
  await new Promise((r) => setTimeout(r, 100));

  const endHeap = Deno.memoryUsage().heapUsed;
  const totalTime = (performance.now() - start) / 1000;

  // Print report
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Flood stress test: ${label} (${DURATION_SEC}s)`);
  console.log("=".repeat(60));
  console.log("");
  console.log("Time(s)  Msgs/sec      Heap(MB)");
  console.log("-".repeat(40));

  for (const s of samples) {
    console.log(
      `${String(s.elapsed).padStart(4)}     ${
        String(s.msgsPerSec).padStart(10)
      }     ${s.heapMB.toFixed(1).padStart(7)}`,
    );
  }

  const peak = Math.max(...samples.map((s) => s.msgsPerSec));
  const avg = Math.round(
    samples.reduce((a, s) => a + s.msgsPerSec, 0) / samples.length,
  );
  const heapStart = Math.round((startHeap / 1024 / 1024) * 10) / 10;
  const heapEnd = Math.round((endHeap / 1024 / 1024) * 10) / 10;

  // Leak detection: check if heap grew monotonically for >10 consecutive samples
  let monotonic = 0;
  let maxMonotonic = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].heapMB > samples[i - 1].heapMB) {
      monotonic++;
      maxMonotonic = Math.max(maxMonotonic, monotonic);
    } else {
      monotonic = 0;
    }
  }

  console.log("");
  console.log("SUMMARY");
  console.log(`  Peak throughput:   ${peak.toLocaleString()} msgs/sec`);
  console.log(`  Avg throughput:    ${avg.toLocaleString()} msgs/sec`);
  console.log(`  Heap at start:     ${heapStart} MB`);
  console.log(`  Heap at end:       ${heapEnd} MB`);
  console.log(`  Heap growth:       ${(heapEnd - heapStart).toFixed(1)} MB`);
  console.log(`  Total processed:   ${totalCount.toLocaleString()} messages`);
  console.log(`  Duration:          ${totalTime.toFixed(1)}s`);

  if (maxMonotonic >= 10) {
    console.log(
      `  ⚠ POSSIBLE LEAK: heap grew monotonically for ${maxMonotonic} consecutive seconds`,
    );
  } else {
    console.log("  Heap: stable (no leak detected)");
  }
}

// CoreClient (no plugins) ---
console.log("Setting up CoreClient...");
const coreClient = new MockCoreClient([], {});
const coreServer = new MockServer(coreClient);
await coreClient.connect("");

await runFlood("CoreClient (no plugins)", coreClient, coreServer);

// Shutdown and set up full client
coreClient.conn?.close();
await new Promise((r) => setTimeout(r, 200));

// Full Client (50+ plugins) ---
console.log("\nSetting up full Client...");
const fullClient = new MockClient({ nick: "me", pingTimeout: false });
const fullServer = new MockServer(fullClient);
await fullClient.connect("");
fullServer.receive();

await runFlood("Full Client (50+ plugins)", fullClient, fullServer);

fullClient.conn?.close();
