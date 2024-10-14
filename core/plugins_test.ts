// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { CoreClient } from "./client.ts";
import { createPlugin, loadPlugins, type Plugin } from "./plugins.ts";

describe("core/plugins", (test) => {
  test("create plugin from factory", () => {
    const p1Fn = () => {};
    const p1 = createPlugin("p1")(p1Fn);
    const p2Fn = () => {};
    const p2 = createPlugin("p2", [p1])(p2Fn);

    assertEquals(p1, { name: "plugins/p1", fn: p1Fn, deps: [] });
    assertEquals(p2, { name: "plugins/p2", fn: p2Fn, deps: [p1] });
  });

  test("load plugins by resolving dependencies", () => {
    const loaded: string[] = [];

    const fakePlugin = (name: string, deps: Plugin<any, any>[] = []) =>
      createPlugin(name, deps)(() => loaded.push(name));

    const p1 = fakePlugin("p1");
    const p2 = fakePlugin("p2", [p1]);
    const p3 = fakePlugin("p3", [p1, p2]);

    const plugins: Plugin<any, any>[] = [p3, p1, p2];
    loadPlugins(null as unknown as CoreClient, {}, plugins);

    assertEquals(loaded, ["p1", "p2", "p3"]);
  });

  test("do not load the same plugin twice", () => {
    const loaded: string[] = [];

    const fakePlugin = (name: string, deps: Plugin<any, any>[] = []) =>
      createPlugin(name, deps)(() => loaded.push(name));

    const p1 = fakePlugin("p1");
    const p2 = fakePlugin("p2");

    const plugins: Plugin<any, any>[] = [p1, p1, p2];
    loadPlugins(null as unknown as CoreClient, {}, plugins);

    assertEquals(loaded, ["p1", "p2"]);
  });
});
