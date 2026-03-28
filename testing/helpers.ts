import { bold, dim } from "@std/fmt/colors";

export type Test = (name: string, fn: () => void | Promise<void>) => void;

const test: Test = typeof Deno !== "undefined"
  // deno-lint-ignore no-explicit-any
  ? Deno.test as any
  // @ts-ignore: Bun global
  : typeof Bun !== "undefined"
  // deno-lint-ignore no-explicit-any
  ? (await import("bun:test")).test as any
  : (await import("node:test")).default;

export function describe(name: string, fn: (test: Test) => void): void {
  fn((testName, fn) => test(prettify(name, testName), fn));
}

function prettify(describeName: string, testName: string) {
  return bold(describeName) + dim(" > ") + testName;
}

export function delay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
