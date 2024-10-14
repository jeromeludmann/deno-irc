import { assertEquals, assertThrows } from "@std/assert";
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

  test("add one listener and remove it", () => {
    const emitter = new EventEmitter();
    let triggered = 0;
    const listener = () => triggered++;

    emitter.on("event", listener);
    emitter.off("event", listener);
    emitter.emit("event", {});

    assertEquals(triggered, 0);
  });

  test("add one listener and do not remove it", () => {
    const emitter = new EventEmitter();
    let triggered = 0;
    const listener = () => triggered++;

    emitter.on("event", listener);
    emitter.off("event2", listener);
    emitter.emit("event", {});

    assertEquals(triggered, 1);
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

  test("throw when trying to add a listener twice for a same event", () => {
    const emitter = new EventEmitter();
    const listener = () => {};

    emitter.on("event", listener);

    assertThrows(
      () => emitter.on("event", listener),
      Error,
      "Given listener already added for 'event' event",
    );
  });

  test("wait an event", async () => {
    const emitter = new EventEmitter();

    const [payload] = await Promise.all([
      emitter.once("event"),
      emitter.emit("event", { key: "value" }),
    ]);

    assertEquals(payload, { key: "value" });
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

  test("throw when emitting errors after memorizing current listener counts", () => {
    const emitter = new EventEmitter();

    assertThrows(
      () => {
        emitter.on("event", () => {});
        (emitter as unknown as { memorizeCurrentListenerCounts: () => void })
          .memorizeCurrentListenerCounts();
        emitter.emit("event", new Error("Boom!"));
      },
      Error,
      "Boom!",
    );
  });

  test("update memorized listener counts if an event has been removed", () => {
    const emitter = new EventEmitter();

    emitter.once("event", () => {});
    emitter.once("event", () => {});
    emitter.once("event", () => {});

    (emitter as unknown as { memorizeCurrentListenerCounts: () => void })
      .memorizeCurrentListenerCounts();

    emitter.emit("event", {});

    assertEquals(emitter.count("event"), 0);
  });

  test("throw when reaching max listener count", () => {
    const emitter = new EventEmitter({ maxListeners: 2 });

    emitter.on("event", () => {});
    emitter.on("event", () => {});

    assertThrows(
      () => emitter.on("event", () => {}),
      Error,
      "Too many listeners for 'event' event",
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

  test("throw when creating multi event that already exists", () => {
    const emitter = new EventEmitter();

    emitter.createMultiEvent("multi_event", ["event1"]);

    assertThrows(
      () => emitter.createMultiEvent("multi_event", ["event1", "event2"]),
      Error,
      "'multi_event' multi event already exists",
    );
  });

  test("create multi events, subscribe to them, emit their related events and remove them", () => {
    const emitter = new EventEmitter();
    const triggered1: unknown[] = [];
    const triggered2: unknown[] = [];

    emitter.createMultiEvent("multi_event1", ["event1", "event2"]);
    emitter.createMultiEvent("multi_event2", ["event1", "event3"]);

    const off1 = emitter.on(
      "multi_event1",
      (payload) => triggered1.push(payload),
    );
    const off2 = emitter.on(
      ["multi_event2"],
      (payload) => triggered2.push(payload),
    );

    emitter.emit("event1", { e: "event1" });
    emitter.emit("event2", { e: "event2" });
    emitter.emit("event3", { e: "event3" });

    assertEquals(triggered1, [{ e: "event1" }, { e: "event2" }]);
    assertEquals(triggered2, [{ e: "event1" }, { e: "event3" }]);

    off1();
    off2();

    emitter.emit("event1", { e: "event1" });
    emitter.emit("event2", { e: "event2" });
    emitter.emit("event3", { e: "event3" });

    assertEquals(triggered1.length, 2);
    assertEquals(triggered2.length, 2);
  });
});
