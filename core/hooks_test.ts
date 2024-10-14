import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { Hooks } from "./hooks.ts";

describe("core/hooks", (test) => {
  test("add a hook before calling method", () => {
    const results: string[] = [];
    const target = { fn: (_arg: string) => results.push("fn") };
    const hooks = new Hooks(target);

    hooks.beforeCall("fn", (arg) => results.push(arg));
    target.fn("arg");

    assertEquals(results, ["arg", "fn"]);
  });

  test("add a hook after calling method", async () => {
    const results: string[] = [];
    const target = {
      fn: () => {
        results.push("fn");
        return Promise.resolve("value");
      },
    };
    const hooks = new Hooks(target);

    hooks.afterCall("fn", (val) => results.push(val));
    await target.fn();

    assertEquals(results, ["fn", "value"]);
  });

  test("add a hook before setting object key", () => {
    const results: string[] = [];
    const target = { object: { key: "" } };
    const hooks = new Hooks(target);

    hooks.beforeMutate("object", (_, key, value) => results.push(key, value));
    target.object.key = "value";

    assertEquals(results, ["key", "value"]);
  });

  test("add a hook before deleting object key", () => {
    const results: string[] = [];
    const target: { object: { key?: string } } = { object: { key: "value" } };
    const hooks = new Hooks(target);

    hooks.beforeMutate("object", (_, key) => results.push(key));
    delete target.object.key;

    assertEquals(results, ["key"]);
  });
});
