type AsyncReturnType<T extends () => any> = ReturnType<T> extends
  PromiseLike<infer U> ? U : ReturnType<T>;

export class Hooks<T extends Record<PropertyKey, any>> {
  constructor(private target: T) {}

  /** Hooks before calling method.
   *
   * The hook function takes all parameters of the method. */
  before<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    this.hook(key, (fn, ...args) => {
      hook(...args);
      return fn(...args as any[]);
    });
  }

  /** Hooks after calling method.
   *
   * The hook function takes the resolved return value of the method. */
  after<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (value: AsyncReturnType<F>) => void,
  >(key: K, hook: H): void {
    this.hook(key, async (fn, ...args) => {
      const value = await fn(...args as any[]);
      hook(value);
      return value;
    });
  }

  private hook<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (callback: F, ...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    const fn = this.target[key].bind(this.target);
    (this.target as any)[key] = (...args: Parameters<F>) => hook(fn, ...args);
  }

  /** Hooks before setting object key. */
  set<
    K extends { [K in keyof T]: T[K] extends Function ? never : K }[keyof T],
    H extends (target: T[K], key: keyof T[K], value: T[K][keyof T[K]]) => void,
  >(key: K, hook: H): void {
    this.target[key] = new Proxy(this.target[key], {
      set: (obj, prop, value) => {
        hook(obj, prop, value);
        obj[prop] = value;
        return true;
      },
    });
  }
}
