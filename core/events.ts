type Listener<T> = (payload: T) => void;

type Listeners<T> = Record<keyof T, Listener<any>[]>;

type DefaultListenerCounts<T> = Record<keyof T, number>;

type InferredPayload<
  TEvents extends Record<string, any>,
  TEventName extends keyof TEvents,
> = TEvents[TEventName];

export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners = {} as Listeners<TEvents>;
  private defaultListenerCounts = {} as DefaultListenerCounts<TEvents>;

  /** Calls all the listeners of the `eventName` with the `eventPayload`. */
  emit<T extends keyof TEvents>(
    eventName: T,
    eventPayload: InferredPayload<TEvents, T>,
  ): void {
    const isThrowable = (
      (eventPayload as unknown) instanceof Error &&
      this.countListeners(eventName) === this.countDefaultListeners(eventName)
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
  async once<T extends keyof TEvents>(
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

  /** Waits for an `eventName` during `delay` in ms. */
  async wait<T extends keyof TEvents>(
    eventName: T,
    delay: number,
  ): Promise<InferredPayload<TEvents, T> | null> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        removeListener();
        resolve(null);
      }, delay);

      const removeListener = this.on(eventName, (payload) => {
        clearTimeout(timeout);
        removeListener();
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

  resetErrorThrowingBehavior(): void {
    this.defaultListenerCounts = {} as DefaultListenerCounts<TEvents>;

    for (const eventName in this.listeners) {
      this.defaultListenerCounts[eventName] = this.listeners[eventName].length;
    }
  }

  private countListeners<T extends keyof TEvents>(eventName: T): number {
    return eventName in this.listeners ? this.listeners[eventName].length : 0;
  }

  private countDefaultListeners<T extends keyof TEvents>(eventName: T): number {
    return eventName in this.defaultListenerCounts
      ? this.defaultListenerCounts[eventName]
      : 0;
  }
}
