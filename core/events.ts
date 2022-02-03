// deno-lint-ignore-file no-explicit-any
type Listener<T> = (payload: T) => void;

type Listeners<T> = Record<keyof T, Listener<any>[]>;

type IgnoredListenerCounts<T> = Record<keyof T, number>;

type InferredPayload<
  TEvents extends Record<string, unknown>,
  TEventName extends keyof TEvents,
> = TEvents[TEventName];

export interface EventEmitterOptions {
  /** Number of maximum registrable listeners.
   *
   * Primarily used to avoid memory leaks.
   *
   * Default limit to `1000` listeners for each event. */
  maxListeners?: number;
}

const MAX_LISTENERS = 1000;

export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners = {} as Listeners<TEvents>;
  private ignoredListenerCounts = {} as IgnoredListenerCounts<TEvents>;
  private maxListeners: number;

  constructor({ maxListeners }: EventEmitterOptions = {}) {
    this.maxListeners = maxListeners ?? MAX_LISTENERS;
  }

  /** Calls all the listeners of the `eventName` with the `eventPayload`. */
  emit<T extends keyof TEvents>(
    eventName: T,
    eventPayload: InferredPayload<TEvents, T>,
  ): void {
    const isThrowable = (
      (eventPayload as unknown) instanceof Error &&
      this.count(eventName) === 0
    );

    if (isThrowable) {
      throw eventPayload;
    }

    if (!(eventName in this.listeners)) {
      return;
    }

    for (const listener of this.listeners[eventName]) {
      listener(eventPayload);
    }
  }

  /** Adds a `listener` for the `eventName`. */
  on<T extends keyof TEvents>(
    eventName: T | T[],
    listener: Listener<InferredPayload<TEvents, T>>,
  ): () => void {
    for (const ev of Array.isArray(eventName) ? eventName : [eventName]) {
      if (this.count(ev) === this.maxListeners) {
        throw new Error(`Too many listeners for "${ev}" event`);
      }

      this.listeners[ev] ??= [];
      this.listeners[ev].push(listener);
    }

    return () => this.off(eventName, listener);
  }

  /** Adds a one-time `listener` for the `eventName`. */
  once<T extends keyof TEvents>(
    eventName: T | T[],
    listener: Listener<InferredPayload<TEvents, T>>,
  ): void;

  /** Promise-based version of `.once(eventName, listener)`. */
  async once<T extends keyof TEvents>(
    eventName: T | T[],
  ): Promise<InferredPayload<TEvents, T>>;

  once<T extends keyof TEvents>(
    eventName: T | T[],
    listener?: Listener<InferredPayload<TEvents, T>>,
  ): void | Promise<InferredPayload<TEvents, T>> {
    if (listener) {
      const removeListener = this.on(eventName, (payload) => {
        removeListener();
        listener(payload);
      });
    } else {
      return new Promise((resolve) => {
        const removeListener = this.on(eventName, (payload) => {
          removeListener();
          resolve(payload);
        });
      });
    }
  }

  /** Waits for an `eventName` during `delay` in ms. */
  wait<T extends keyof TEvents>(
    eventName: T | T[],
    delay: number,
  ): Promise<InferredPayload<TEvents, T> | null> {
    return new Promise((resolve) => {
      const listener = (payload: InferredPayload<TEvents, T>) => {
        clearTimeout(timeout);
        resolve(payload);
      };

      this.once(eventName, listener);

      const timeout = setTimeout(() => {
        this.off(eventName, listener);
        resolve(null);
      }, delay);
    });
  }

  /** Removes the `listener` of the `eventName`. */
  off<T extends keyof TEvents>(
    eventName: T | T[],
    listener: Listener<InferredPayload<TEvents, T>>,
  ): void {
    for (const ev of Array.isArray(eventName) ? eventName : [eventName]) {
      const listeners = this.listeners[ev].filter((fn) => fn !== listener);
      this.listeners[ev] = listeners;
    }
  }

  /** Counts the listeners of the `eventName`. */
  count<T extends keyof TEvents>(eventName: T): number {
    if (!(eventName in this.listeners)) {
      return 0;
    }

    const listenerCount = this.listeners[eventName].length;
    const ignoredListenerCount = this.ignoredListenerCounts[eventName] ?? 0;

    if (listenerCount < ignoredListenerCount) {
      return 0;
    }

    return listenerCount - ignoredListenerCount;
  }

  /** Resets the error throwing behavior based on current listener counts. */
  protected resetErrorThrowingBehavior(): void {
    this.ignoreCurrentListenerCounts();
  }

  private ignoreCurrentListenerCounts(): void {
    this.ignoredListenerCounts = {} as IgnoredListenerCounts<TEvents>;

    for (const eventName in this.listeners) {
      this.ignoredListenerCounts[eventName] = this.listeners[eventName].length;
    }
  }
}
