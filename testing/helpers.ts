import { bold, dim } from "../deps.ts";

export type Test = (name: string, fn: () => void | Promise<void>) => void;

export function describe(name: string, fn: (test: Test) => void): void {
  fn((testName, fn) => Deno.test(prettify(name, testName), fn));
}

function prettify(describeName: string, testName: string) {
  return bold(describeName) + dim(" > ") + testName;
}

// https://stackoverflow.com/a/50375286/13457771
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I
    : never;
