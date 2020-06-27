import { EventEmitter } from "./events.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("add one listener and emit an event", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;
  let value: any;

  emitter.on("event", (val: any) => {
    triggered++;
    value = val;
  });
  await emitter.emit("event", { key: "value" });

  assertEquals(triggered, 1);
  assertEquals(value, { key: "value" });
});

Deno.test("add two listeners and emit an event", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;

  emitter.on("event", () => {
    triggered++;
  });
  emitter.on("event", () => {
    triggered++;
  });
  await emitter.emit("event", {});

  assertEquals(triggered, 2);
});

Deno.test("add one listener and emit a different event", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;

  emitter.on("event", () => {
    triggered++;
  });
  await emitter.emit("msg2", {});

  assertEquals(triggered, 0);
});

Deno.test("add two listeners and remove one of them", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;

  const off1 = emitter.on("event", () => {
    triggered++;
  });
  emitter.on("event", () => {
    triggered++;
  });
  off1();
  await emitter.emit("event", {});

  assertEquals(triggered, 1);
});

Deno.test("add two listeners and remove all of them", async () => {
  const emitter = new EventEmitter();
  let triggered1 = 0;
  let triggered2 = 0;

  const off1 = emitter.on("event", () => {
    triggered1++;
  });
  const off2 = emitter.on("event", () => {
    triggered2++;
  });
  off1();
  off2();
  await emitter.emit("event", {});

  assertEquals(triggered1, 0);
  assertEquals(triggered2, 0);
});

Deno.test("add a listener twice and emit an event", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;
  const listener = () => {
    triggered++;
  };

  emitter.on("event", listener);
  emitter.on("event", listener);
  await emitter.emit("event", {});

  assertEquals(triggered, 2);
});

Deno.test("add a listener twice and remove it", async () => {
  const emitter = new EventEmitter();
  let triggered = 0;
  const listener = () => {
    triggered++;
  };
  let off: () => void;

  off = emitter.on("event", listener);
  emitter.on("event", listener);
  off();
  await emitter.emit("event", {});

  assertEquals(triggered, 0);
});

Deno.test("wait an event", async () => {
  const emitter = new EventEmitter();

  const [payload] = await Promise.all([
    emitter.once("event"),
    emitter.emit("event", { key: "value" }),
  ]);

  assertEquals(payload, { key: "value" });
});
