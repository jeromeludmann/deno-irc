// deno-lint-ignore-file no-explicit-any
type Listener<T> = (payload: T) => void;

type EventListeners<T> = Map<keyof T, Set<Listener<any>>>;

type MemorizedEventListenerCounts<T> = Map<keyof T, number>;

type MultiEventNames<T> = Map<keyof T, (keyof T)[]>;

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

const MAX_LISTENERS_PER_EVENT = 1000;

export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners: EventListeners<TEvents>;
  private multiEventNames: MultiEventNames<TEvents>;
  private memorizedListenerCounts: MemorizedEventListenerCounts<TEvents>;
  private maxListenersCount: number;

  constructor({ maxListeners }: EventEmitterOptions = {}) {
    this.listeners = new Map();
    this.memorizedListenerCounts = new Map();
    this.multiEventNames = new Map();
    this.maxListenersCount = maxListeners ?? MAX_LISTENERS_PER_EVENT;
  }

  /** Calls all the listeners of the `eventName` with the `eventPayload`. */
  emit<T extends keyof TEvents>(
    eventName: T,
    eventPayload: InferredPayload<TEvents, T>,
  ): void {
    const shouldBeThrown = (eventPayload as unknown) instanceof Error &&
      this.count(eventName) === 0;
    if (shouldBeThrown) {
      throw eventPayload;
    }

    const listeners = this.listeners.get(eventName);
    if (listeners === undefined) return;

    for (const listener of listeners) {
      listener(eventPayload);
    }
  }

  /** Adds a `listener` for the `eventName`. */
  on<T extends keyof TEvents>(
    eventName: T | T[],
    listener: Listener<InferredPayload<TEvents, T>>,
  ): () => void {
    for (const event of this.remapEventNames<T>(eventName)) {
      if (this.count(event) === this.maxListenersCount) {
        throw new Error(`Too many listeners for '${String(event)}' event`);
      }

      let listeners = this.listeners.get(event);

      if (listeners === undefined) {
        listeners = new Set([listener]);
        this.listeners.set(event, listeners);
      } else if (listeners.has(listener)) {
        throw new Error(
          `Given listener already added for '${String(event)}' event`,
        );
      }

      listeners.add(listener);
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
    if (listener === undefined) {
      return new Promise((resolve) => {
        const removeListener = this.on(eventName, (payload) => {
          removeListener();
          resolve(payload);
        });
      });
    } else {
      const removeListener = this.on(eventName, (payload) => {
        removeListener();
        listener(payload);
      });
    }
  }

  /** Removes the `listener` of the `eventName`. */
  off<T extends keyof TEvents>(
    eventName: T | T[],
    listener: Listener<InferredPayload<TEvents, T>>,
  ): void {
    for (const event of this.remapEventNames<T>(eventName)) {
      const listeners = this.listeners.get(event);
      if (listeners === undefined) continue;

      if (listeners.delete(listener)) {
        const count = this.memorizedListenerCounts.get(event);
        if (count !== undefined && count > 0) {
          this.memorizedListenerCounts.set(event, count - 1);
        }
      }
    }
  }

  /** Counts the listeners of the `eventName`. */
  count<T extends keyof TEvents>(eventName: T): number {
    const listeners = this.listeners.get(eventName);
    if (listeners === undefined) return 0;

    const memorizedListenerCount =
      this.memorizedListenerCounts.get(eventName) ?? 0;

    return listeners.size - memorizedListenerCount;
  }

  protected memorizeCurrentListenerCounts(): void {
    for (const [eventName, listeners] of this.listeners.entries()) {
      this.memorizedListenerCounts.set(eventName, listeners.size);
    }
  }

  /** Allows to permanently create a `multiEventName` that will be triggered
   * if one of `relatedEventNames` is emitted. */
  createMultiEvent<T extends keyof TEvents>(
    multiEventName: T,
    relatedEventNames: T[],
  ): void {
    if (this.multiEventNames.has(multiEventName)) {
      throw new Error(`'${String(multiEventName)}' multi event already exists`);
    }
    this.multiEventNames.set(
      multiEventName,
      Array.from(new Set(relatedEventNames)),
    );
  }

  private remapEventNames<T extends keyof TEvents>(eventNames: T | T[]) {
    return (Array.isArray(eventNames) ? eventNames : [eventNames])
      // remaps multi events to their related events
      .flatMap((event) => this.multiEventNames.get(event) ?? event);
  }
}
