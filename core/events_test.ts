import { assertEquals, assertThrows } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { EventEmitter } from "./events.ts";

describe("core/events", (test) => {
  test("add one listener and emit an event", () => {
    const emitter = new EventEmitter();
    let triggered = 0;
    let value: unknown;

    emitter.on("event", (val) => {
      triggered++;
      value = val;
    });
    emitter.emit("event", { key: "value" });

    assertEquals(triggered, 1);
    assertEquals(value, { key: "value" });
  });

  test("add two listeners and emit an event", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    emitter.on("event", () => triggered++);
    emitter.on("event", () => triggered++);
    emitter.emit("event", {});

    assertEquals(triggered, 2);
  });

  test("add one listener and emit a different event", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    emitter.on("event", () => triggered++);
    emitter.emit("event2", {});

    assertEquals(triggered, 0);
  });

  test("add two listeners and remove one of them", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    const off1 = emitter.on("event", () => triggered++);
    emitter.on("event", () => triggered++);
    off1();
    emitter.emit("event", {});

    assertEquals(triggered, 1);
  });

  test("add two listeners and remove all of them", () => {
    const emitter = new EventEmitter();
    let triggered1 = 0;
    let triggered2 = 0;

    const off1 = emitter.on("event", () => triggered1++);
    const off2 = emitter.on("event", () => triggered2++);
    off1();
    off2();
    emitter.emit("event", {});

    assertEquals(triggered1, 0);
    assertEquals(triggered2, 0);
  });

  test("add a listener twice and emit an event", () => {
    const emitter = new EventEmitter();
    let triggered = 0;
    const listener = () => triggered++;

    emitter.on("event", listener);
    emitter.on("event", listener);
    emitter.emit("event", {});

    assertEquals(triggered, 2);
  });

  test("add a listener twice and remove it", () => {
    const emitter = new EventEmitter();
    let triggered = 0;
    const listener = () => triggered++;

    const off = emitter.on("event", listener);
    emitter.on("event", listener);
    off();
    emitter.emit("event", {});

    assertEquals(triggered, 0);
  });

  test("wait an event", async () => {
    const emitter = new EventEmitter();

    const [payload] = await Promise.all([
      emitter.once("event"),
      emitter.emit("event", { key: "value" }),
    ]);

    assertEquals(payload, { key: "value" });
  });

  test("wait an event for a given time", async () => {
    const emitter = new EventEmitter();

    const [payload] = await Promise.all([
      emitter.wait("event", 1),
      emitter.emit("event", { key: "value" }),
    ]);

    assertEquals(payload, { key: "value" });

    const [never] = await Promise.all([
      emitter.wait("event", 1),
      emitter.emit("event2", { key: "value" }),
    ]);

    assertEquals(never, null);
  });

  test("throw when emitting errors without bound listener", () => {
    const emitter = new EventEmitter();

    assertThrows(
      () => emitter.emit("event", new Error("Boom!")),
      Error,
      "Boom!",
    );
  });

  test("not throw when emitting errors with bound listener", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    emitter.on("event", () => triggered++);
    emitter.emit("event", new Error("Boom!"));

    assertEquals(triggered, 1);
  });

  test("throw when emitting errors after reseting error throwing behavior", () => {
    const emitter = new EventEmitter();

    assertThrows(
      () => {
        emitter.on("event", () => {});
        (emitter as unknown as { resetErrorThrowingBehavior: () => void })
          .resetErrorThrowingBehavior();
        emitter.emit("event", new Error("Boom!"));
      },
      Error,
      "Boom!",
    );
  });

  test("throw when reaching max listener count", () => {
    const emitter = new EventEmitter({ maxListeners: 2 });
    const noop = () => {};

    emitter.on("event", noop);
    emitter.on("event", noop);

    assertThrows(
      () => emitter.on("event", noop),
      Error,
      'Too many listeners for "event" event',
    );
  });

  test("add one listener on three events and emit an event", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    emitter.on(["event1", "event2", "event3"], () => {
      triggered++;
    });

    emitter.emit("event1", {}); // +1
    emitter.emit("event2", {}); // +2
    emitter.emit("event3", {}); // +3
    emitter.emit("event4", {}); // should not be triggered

    assertEquals(triggered, 3);
  });

  test("add one listener on three events and remove it", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    const off = emitter.on(["event1", "event2", "event3"], () => {
      triggered++;
    });

    off();

    emitter.emit("event1", {}); // should not be triggered
    emitter.emit("event2", {}); // should not be triggered
    emitter.emit("event3", {}); // should not be triggered

    assertEquals(triggered, 0);
  });

  test("wait for several events", () => {
    const emitter = new EventEmitter();
    let triggered = 0;

    emitter.once(["event1", "event2", "event3"], () => {
      triggered++;
    });

    emitter.emit("event1", { key: "value" }); // +1
    emitter.emit("event2", { key: "value" }); // should not be triggered
    emitter.emit("event3", { key: "value" }); // should not be triggered

    assertEquals(triggered, 1);
  });
});
