// deno-lint-ignore-file no-explicit-any

import { type CoreClient, type CoreFeatures } from "./client.ts";
import { type Hooks } from "./hooks.ts";

type AnyPluginFeaturesKey =
  | "options"
  | "commands"
  | "events"
  | "state"
  | "utils";

type PluginFeatures = {
  [K in AnyPluginFeaturesKey]?: Record<string, unknown>;
};

export interface Plugin<
  F extends PluginFeatures = Record<never, never>,
  P extends Plugin<any, any>[] = [],
> {
  name: `plugins/${string}`;
  deps: P;
  fn: PluginFn<F>;
}

type ExtendedClient<F extends PluginFeatures> =
  & CoreClient<CoreFeatures["events"] & F["events"]>
  & { readonly hooks: Hooks<ExtendedClient<F>> }
  & { readonly state: F["state"] }
  & { readonly utils: F["utils"] }
  & F["commands"];

type ExtendedOptions<T extends PluginFeatures> =
  & CoreFeatures["options"]
  & T["options"];

// https://stackoverflow.com/a/50375286
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends ((k: infer I) => void) ? I : never;

type InferPluginFeatures<
  P extends Plugin,
> = P extends Plugin<infer F, infer _P> ? F : PluginFeatures;

export type CombinePluginFeatures<
  P extends Plugin<any, any>[],
> = UnionToIntersection<InferPluginFeatures<P[number]>>;

type PluginFn<
  F extends PluginFeatures = Record<never, never>,
  P extends Plugin[] = [],
> = (
  client: ExtendedClient<CombinePluginFeatures<P> & F>,
  options: Readonly<ExtendedOptions<CombinePluginFeatures<P> & F>>,
) => void;

export function loadPlugins(
  client: CoreClient<any>,
  options: CoreFeatures["options"],
  plugins: Plugin[],
): void {
  const deps = new Set<string>();

  const resolvePluginDeps = (plugin: Plugin<any>) => {
    if (deps.has(plugin.name)) {
      return;
    }
    for (const dep of plugin.deps) {
      resolvePluginDeps(dep);
    }
    plugin.fn(client, options);
    deps.add(plugin.name);
  };

  for (const plugin of plugins) {
    resolvePluginDeps(plugin);
  }
}

export function createPlugin<P extends Plugin<any, any>[] = []>(
  /** Unique name of the plugin. */
  name: string,
  /** Dependencies of the plugin.
   *
   * Required plugins to load the plugin. They will be loaded before. */
  deps: P = [] as unknown as P,
) {
  return <
    F extends PluginFeatures = Record<never, never>,
  >(fn: PluginFn<F, P>): Plugin<F, P> => ({
    name: `plugins/${name}`,
    deps,
    fn: fn as PluginFn<any, any>,
  });
}
