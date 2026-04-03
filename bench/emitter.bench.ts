import { EventEmitter } from "../core/events.ts";

interface Payload {
  command: string;
  params: string[];
}

interface BenchEvents {
  "ev": Payload;
  "privmsg": Payload;
  "privmsg:channel": Payload;
  "privmsg:private": Payload;
}

const PAYLOAD: Payload = { command: "privmsg", params: ["#ch", "hello"] };

// Isolated emitters per listener count
const emitter0 = new EventEmitter<BenchEvents>();

const emitter1 = new EventEmitter<BenchEvents>();
emitter1.on("ev", () => {});

const emitter10 = new EventEmitter<BenchEvents>();
for (let i = 0; i < 10; i++) emitter10.on("ev", () => {});

const emitter50 = new EventEmitter<BenchEvents>();
for (let i = 0; i < 50; i++) emitter50.on("ev", () => {});

// Multi-event: simulates privmsg → [privmsg:channel, privmsg:private]
const emitterMulti = new EventEmitter<BenchEvents>();
emitterMulti.createMultiEvent("privmsg", [
  "privmsg:channel",
  "privmsg:private",
]);
for (let i = 0; i < 5; i++) emitterMulti.on("privmsg:channel", () => {});
for (let i = 0; i < 5; i++) emitterMulti.on("privmsg:private", () => {});

const emitterReg = new EventEmitter<BenchEvents>();

Deno.bench({
  name: "emit: no listener (fast path)",
  group: "emit",
  baseline: true,
  fn() {
    emitter0.emit("ev", PAYLOAD);
  },
});

Deno.bench({
  name: "emit: 1 listener",
  group: "emit",
  fn() {
    emitter1.emit("ev", PAYLOAD);
  },
});

Deno.bench({
  name: "emit: 10 listeners",
  group: "emit",
  fn() {
    emitter10.emit("ev", PAYLOAD);
  },
});

Deno.bench({
  name: "emit: 50 listeners",
  group: "emit",
  fn() {
    emitter50.emit("ev", PAYLOAD);
  },
});

Deno.bench({
  name: "emit: multi-event (2 targets × 5 listeners)",
  group: "emit",
  fn() {
    emitterMulti.emit("privmsg", PAYLOAD);
  },
});

Deno.bench({
  name: "on + off cycle",
  group: "registration",
  fn() {
    const fn = () => {};
    const off = emitterReg.on("ev", fn);
    off();
  },
});

Deno.bench({
  name: "once (promise-based)",
  group: "registration",
  async fn() {
    const p = emitterReg.once("ev");
    emitterReg.emit("ev", PAYLOAD);
    await p;
  },
});
