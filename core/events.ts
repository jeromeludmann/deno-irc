type Listener<T> = (payload: T) => void;

type Listeners<T> = Record<keyof T, Listener<any>[]>;

type InferredPayload<
  TEvents extends Record<string, any>,
  TEventName extends keyof TEvents,
> = TEvents[TEventName];

export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners = {} as Listeners<TEvents>;

  /** Calls all the listeners of the `eventName` with the `eventPayload`. */
  emit<T extends keyof TEvents>(
    eventName: T,
    eventPayload: InferredPayload<TEvents, T>,
  ): void {
    if (!(eventName in this.listeners)) {
      return;
    }

    for (const listener of this.listeners[eventName]) {
      listener(eventPayload);
    }
  }

  /** Adds a `listener` for the `eventName`. */
  on<T extends keyof TEvents>(
    eventName: T,
    listener: Listener<InferredPayload<TEvents, T>>,
  ): () => void {
    this.listeners[eventName] ??= [];
    this.listeners[eventName].push(listener);
    return () => this.off(eventName, listener);
  }

  /** Adds a one-time `listener` for the `eventName`. */
  once<T extends keyof TEvents>(
    eventName: T,
    listener: Listener<InferredPayload<TEvents, T>>,
  ): void;

  /** Promise-based version of `.once(eventName, listener)`. */
  once<T extends keyof TEvents>(
    eventName: T,
  ): Promise<InferredPayload<TEvents, T>>;

  once<T extends keyof TEvents>(
    eventName: T,
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

  /** Waits for an `eventName` for `timeout` ms (default to `1000` ms). */
  wait<T extends keyof TEvents>(
    eventName: T,
    delay: number = 1000,
  ): Promise<InferredPayload<TEvents, T> | null> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        removeListener();
        resolve(null);
      }, delay);

      const removeListener = this.on(eventName, (payload) => {
        removeListener();
        clearTimeout(timeout);
        resolve(payload);
      });
    });
  }

  /** Removes the `listener` of the `eventName`. */
  off<T extends keyof TEvents>(
    eventName: T,
    listener?: Listener<InferredPayload<TEvents, T>>,
  ): void {
    this.listeners[eventName] = this.listeners[eventName]
      .filter((fn) => fn !== listener);

    if (this.listeners[eventName].length === 0) {
      delete this.listeners[eventName];
    }
  }

  /** Counts the number of listeners bound to the `eventName`. */
  getListenerCount<T extends keyof TEvents>(eventName: T): number {
    return eventName in this.listeners ? this.listeners[eventName].length : 0;
  }

  /** Counts all the numbers of existing listeners. */
  getAllListenersCounts(): Record<keyof TEvents, number> {
    return Object.keys(this.listeners).reduce(
      (counts, eventName: keyof TEvents) => {
        counts[eventName] = this.getListenerCount(eventName);
        return counts;
      },
      {} as Record<keyof TEvents, number>,
    );
  }
}
