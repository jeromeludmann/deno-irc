import { bold, dim } from "@std/fmt/colors";

export type Test = (name: string, fn: () => void | Promise<void>) => void;

export function describe(name: string, fn: (test: Test) => void): void {
  fn((testName, fn) => Deno.test(prettify(name, testName), fn));
}

function prettify(describeName: string, testName: string) {
  return bold(describeName) + dim(" > ") + testName;
}

export function delay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
