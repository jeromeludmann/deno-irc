type AsyncReturnType<T extends () => unknown> = Awaited<ReturnType<T>>;

type FunctionKeys<T> = {
  // deno-lint-ignore ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
type NonFunctionKeys<T> = {
  // deno-lint-ignore ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/** Intercepts method calls and property mutations on a target object via monkey-patching and proxies. */
// deno-lint-ignore no-explicit-any
export class Hooks<T extends Record<PropertyKey, any>> {
  constructor(private target: T) {}

  /** Hooks before calling method.
   *
   * The hook function takes all parameters of the method. */
  beforeCall<
    K extends FunctionKeys<T>,
    // deno-lint-ignore ban-types
    F extends T[K] & Function,
    H extends (...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    this.hookCall(key, (fn, ...args) => {
      hook(...args);
      return fn(...args as unknown[]);
    });
  }

  /** Hooks after calling method.
   *
   * The hook function takes the resolved return value of the method. */
  afterCall<
    K extends FunctionKeys<T>,
    // deno-lint-ignore ban-types
    F extends T[K] & Function,
    H extends (value: AsyncReturnType<F>) => void,
  >(key: K, hook: H): void {
    this.hookCall(key, async (fn, ...args) => {
      const value = await fn(...args as unknown[]);
      hook(value);
      return value;
    });
  }

  /** Base hook call method. */
  hookCall<
    K extends FunctionKeys<T>,
    // deno-lint-ignore ban-types
    F extends T[K] & Function,
    H extends (fn: F, ...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    const fn = this.target[key].bind(this.target);
    // deno-lint-ignore no-explicit-any
    (this.target as any)[key] = (...args: Parameters<F>) => hook(fn, ...args);
  }

  /** Hooks before mutating object. */
  beforeMutate<
    K extends NonFunctionKeys<T>,
    H extends (obj: T[K], key: keyof T[K], value: T[K][keyof T[K]]) => void,
  >(key: K, hook: H): void {
    const proxyCache = new WeakMap<object, object>();
    const proxyHandler: ProxyHandler<T[K]> = {
      get: (obj, key) => {
        const value = obj[key];
        if (typeof value !== "object" || value === null) return value;
        const cached = proxyCache.get(value);
        if (cached) return cached;
        const proxied = new Proxy(value, proxyHandler);
        proxyCache.set(value, proxied);
        return proxied;
      },
      set: (obj, key, value) => {
        hook(obj, key, value);
        obj[key] = value;
        return true;
      },
      deleteProperty: (obj, key) => {
        hook(obj, key, undefined);
        delete obj[key];
        return true;
      },
    };
    this.target[key] = new Proxy(this.target[key], proxyHandler);
  }
}
