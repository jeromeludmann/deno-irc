import { assertEquals, assertRejects } from "@std/assert";
import { delay, describe } from "../testing/helpers.ts";
import { newQueue } from "./queue.ts";

describe("core/queue", (test) => {
  test("add() returns the resolved value", async () => {
    const queue = newQueue(1);
    const result = await queue.add(() => Promise.resolve(42));
    assertEquals(result, 42);
  });

  test("tasks execute sequentially with concurrency 1", async () => {
    const queue = newQueue(1);
    let running = 0;
    let maxRunning = 0;

    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await delay(10);
      running--;
    };

    await Promise.all([queue.add(task), queue.add(task), queue.add(task)]);
    assertEquals(maxRunning, 1);
  });

  test("tasks execute in FIFO order", async () => {
    const queue = newQueue(1);
    const order: number[] = [];

    await Promise.all([
      queue.add(async () => {
        await delay(5);
        order.push(1);
      }),
      queue.add(() => {
        order.push(2);
        return Promise.resolve();
      }),
      queue.add(() => {
        order.push(3);
        return Promise.resolve();
      }),
    ]);

    assertEquals(order, [1, 2, 3]);
  });

  test("a rejected task does not block subsequent tasks", async () => {
    const queue = newQueue(1);

    const failing = queue.add(() => Promise.reject(new Error("boom")));
    const passing = queue.add(() => Promise.resolve("ok"));

    await assertRejects(() => failing, Error, "boom");
    assertEquals(await passing, "ok");
  });

  test("parallel adds are properly serialized", async () => {
    const queue = newQueue(1);
    let counter = 0;

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        queue.add(async () => {
          const current = counter++;
          await delay(1);
          return `task-${i}-at-${current}`;
        })),
    );

    assertEquals(results, [
      "task-0-at-0",
      "task-1-at-1",
      "task-2-at-2",
      "task-3-at-3",
      "task-4-at-4",
    ]);
  });
});
