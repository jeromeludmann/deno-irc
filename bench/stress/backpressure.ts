import { MockCoreClient } from "../../testing/client.ts";
import { MockServer } from "../../testing/server.ts";
import { MSG_PLAIN } from "../fixtures.ts";

const N = 5000;
const CONSUMER_DELAY_MS = 1;

console.log(
  `Backpressure test: ${N} messages, ${CONSUMER_DELAY_MS}ms consumer delay`,
);
console.log("=".repeat(60));

const client = new MockCoreClient([], {});
const server = new MockServer(client);
await client.connect("");

const sendTimestamps: number[] = [];
const receiveTimestamps: number[] = [];
let received = 0;

const done = new Promise<void>((resolve) => {
  client.on("raw:privmsg", async () => {
    receiveTimestamps.push(performance.now());
    await new Promise((r) => setTimeout(r, CONSUMER_DELAY_MS));
    received++;
    if (received === N) resolve();
    else {
      sendTimestamps.push(performance.now());
      server.send(MSG_PLAIN);
    }
  });
});

// Start the chain
const start = performance.now();
sendTimestamps.push(start);
server.send(MSG_PLAIN);

await done;

const totalTime = performance.now() - start;

// Compute lag: time between send and receive for each message
const lags: number[] = [];
for (
  let i = 0;
  i < Math.min(sendTimestamps.length, receiveTimestamps.length);
  i++
) {
  lags.push(receiveTimestamps[i] - sendTimestamps[i]);
}

const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length;
const maxLag = Math.max(...lags);
const minLag = Math.min(...lags);
const p99Idx = Math.floor(lags.length * 0.99);
const sortedLags = [...lags].sort((a, b) => a - b);
const p99Lag = sortedLags[p99Idx] ?? maxLag;

const heapMB = Deno.memoryUsage().heapUsed / 1024 / 1024;

console.log("");
console.log("RESULTS");
console.log(`  Messages processed: ${received.toLocaleString()}`);
console.log(`  Total time:         ${(totalTime / 1000).toFixed(2)}s`);
console.log(
  `  Effective rate:     ${
    Math.round(received / (totalTime / 1000)).toLocaleString()
  } msgs/sec`,
);
console.log(`  Latency (send→recv):`);
console.log(`    min:   ${minLag.toFixed(3)}ms`);
console.log(`    avg:   ${avgLag.toFixed(3)}ms`);
console.log(`    p99:   ${p99Lag.toFixed(3)}ms`);
console.log(`    max:   ${maxLag.toFixed(3)}ms`);
console.log(`  Heap:    ${heapMB.toFixed(1)} MB`);
console.log("");

if (maxLag > CONSUMER_DELAY_MS * 10) {
  console.log(
    `  ⚠ High max latency (${maxLag.toFixed(1)}ms) — possible queue buildup`,
  );
} else {
  console.log(
    "  ✓ Latency stable — read loop stalls naturally (no unbounded queue)",
  );
}

client.conn?.close();
