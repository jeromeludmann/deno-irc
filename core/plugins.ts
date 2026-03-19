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

/** Defines a named plugin with its dependencies and initialization function. */
export interface Plugin<
  F extends PluginFeatures = Record<never, never>,
  // deno-lint-ignore no-explicit-any
  P extends Plugin<any, any>[] = [],
> {
  name: `plugins/${string}`;
  deps: P;
  fn: PluginFn<F>;
}

/** Type alias for plugin dependency arrays, centralizing `any` usage. */
// deno-lint-ignore no-explicit-any
export type AnyPlugins = Plugin<any, any>[];

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

/** Merges the feature types of multiple plugins into a single intersection type. */
export type CombinePluginFeatures<
  // deno-lint-ignore no-explicit-any
  P extends Plugin<any, any>[],
> = UnionToIntersection<InferPluginFeatures<P[number]>>;

type PluginFn<
  F extends PluginFeatures = Record<never, never>,
  P extends Plugin[] = [],
> = (
  client: ExtendedClient<CombinePluginFeatures<P> & F>,
  options: Readonly<ExtendedOptions<CombinePluginFeatures<P> & F>>,
) => void;

/** Resolves plugin dependency graph and initializes all plugins on the client. */
export function loadPlugins(
  // deno-lint-ignore no-explicit-any
  client: CoreClient<any>,
  options: CoreFeatures["options"],
  plugins: Plugin[],
): void {
  const loaded = new Set<string>();

  // deno-lint-ignore no-explicit-any
  const resolvePluginDeps = (plugin: Plugin<any>, stack: string[]) => {
    if (loaded.has(plugin.name)) return;

    const cycleIndex = stack.indexOf(plugin.name);
    if (cycleIndex !== -1) {
      const cycle = [...stack.slice(cycleIndex), plugin.name].join(" -> ");
      throw new Error(`Circular plugin dependency detected: ${cycle}`);
    }

    stack.push(plugin.name);
    for (const dep of plugin.deps) {
      resolvePluginDeps(dep, stack);
    }
    plugin.fn(client, options);
    loaded.add(plugin.name);
    stack.pop();
  };

  for (const plugin of plugins) {
    resolvePluginDeps(plugin, []);
  }
}

/** Factory for creating a typed plugin with optional dependencies. */
// deno-lint-ignore no-explicit-any
export function createPlugin<P extends Plugin<any, any>[] = []>(
  /** Unique name of the plugin. */
  name: string,
  /** Dependencies of the plugin.
   *
   * Required plugins to load the plugin. They will be loaded before. */
  deps: P = [] as unknown as P,
): <F extends PluginFeatures = Record<never, never>>(
  fn: PluginFn<F, P>,
) => Plugin<F, P> {
  return <
    F extends PluginFeatures = Record<never, never>,
  >(fn: PluginFn<F, P>): Plugin<F, P> => ({
    name: `plugins/${name}`,
    deps,
    // deno-lint-ignore no-explicit-any
    fn: fn as PluginFn<any, any>,
  });
}
