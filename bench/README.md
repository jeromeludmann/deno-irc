# Benchmarks & Stress Tests

## Quick start

```bash
# All benchmarks (parser, emitter, pipeline)
deno task bench

# Parser only
deno task bench:parser

# Stress test — sustained flood for 30s
deno task stress

# Stress test — slow consumer / backpressure
deno task stress:backpressure
```

## What is measured

### `parser.bench.ts` — Parser throughput

Measures `parseChunk()` throughput on different message types:

- **Single message**: one plain or tagged PRIVMSG per iteration
- **Batch 1000**: 1000 messages in one chunk (realistic TCP read)

### `emitter.bench.ts` — EventEmitter throughput

Internal characterization of the event system:

- Emit with 0, 1, 10, 50 listeners
- Multi-event dispatch (e.g. `privmsg` → `privmsg:channel` + `privmsg:private`)
- `on`/`off` registration cycle
- Promise-based `once`

### `pipeline.bench.ts` — Full message pipeline

End-to-end: `MockConn → read → decode → parse → emit(raw:*) → listener`

- **CoreClient** (no plugins): raw protocol overhead
- **Full Client** (50+ plugins): measures plugin dispatch overhead
- Single message and 80-message batch variants

### `stress/flood.ts` — Sustained flood

Sends messages continuously for 30 seconds via chained microtask sends.
Reports per-second throughput and heap usage. Detects memory leaks by checking
for monotonically growing heap over 10+ consecutive seconds.

Runs two passes: CoreClient (no plugins) then full Client (50+ plugins).

### `stress/backpressure.ts` — Slow consumer

Injects 1ms artificial delay in the message listener. Verifies that the read
loop stalls naturally (pull-based `once("read")`) without accumulating an
unbounded event queue. Reports send-to-receive latency percentiles.

## Interpreting results

`deno bench` outputs: `avg`, `min`, `max`, `p75`, `p99`, `p995`, `p999`, and
iterations/second.

For batch benchmarks, multiply iterations/sec by the batch size (80 or 1000) to
get messages/sec.

Use `--json` and pipe to `bench/report.ts` for a formatted comparison table.
