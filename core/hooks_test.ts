import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { Hooks } from "./hooks.ts";

describe("core/hooks", (test) => {
  test("add a hook before calling method", async () => {
    const results: string[] = [];
    const target = { fn: (arg: string) => results.push("fn") };
    const hooks = new Hooks(target);

    hooks.before("fn", (arg) => results.push(arg));
    target.fn("arg");

    assertEquals(results, ["arg", "fn"]);
  });

  test("add a hook after calling method", async () => {
    const results: string[] = [];
    const target = {
      fn: async () => {
        results.push("fn");
        return "value";
      },
    };
    const hooks = new Hooks(target);

    hooks.after("fn", (val) => results.push(val));
    await target.fn();

    assertEquals(results, ["fn", "value"]);
  });

  test("add a hook before setting object key", () => {
    const results: string[] = [];
    const target = { object: { key: "" } };
    const hooks = new Hooks(target);

    hooks.set("object", (object, key, value) => results.push(key, value));
    target.object.key = "value";

    assertEquals(results, ["key", "value"]);
  });
});
