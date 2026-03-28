export type {
  Conn,
  ConnectOptions,
  ConnectTlsOptions,
  Runtime,
} from "./types.ts";

import type { Runtime } from "./types.ts";

const runtime: Promise<Runtime> = typeof Deno !== "undefined"
  ? import("./deno.ts").then((m) => m.runtime)
  // @ts-ignore: Bun global
  : typeof Bun !== "undefined"
  ? import("./bun.ts").then((m) => m.runtime)
  : import("./node.ts").then((m) => m.runtime);

export function getRuntime(): Promise<Runtime> {
  return runtime;
}
