type Listener<T> = (payload: T) => void;

type Listeners<T> = Record<keyof T, Listener<any>[]>;

type InferredPayload<
  TEvents extends Record<string, any>,
  TEventName extends keyof TEvents,
> = TEvents[TEventName];

export class EventEmitter<TEvents extends Record<string, any>> {
  private listeners = {} as Listeners<TEvents>;

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

  on<T extends keyof TEvents>(
    eventName: T,
    listener: Listener<InferredPayload<TEvents, T>>,
  ): () => void {
    this.listeners[eventName] ??= [];
    this.listeners[eventName].push(listener);
    return () => this.off(eventName, listener);
  }

  once<T extends keyof TEvents>(
    eventName: T,
    listener: Listener<InferredPayload<TEvents, T>>,
  ): void;

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

  listenerCount<T extends keyof TEvents>(eventName: T): number {
    return eventName in this.listeners ? this.listeners[eventName].length : 0;
  }
}
