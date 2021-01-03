import { Plugin, RemoteAddr } from "../core/client.ts";
import { ClientError } from "../core/errors.ts";
import { Raw } from "../core/parsers.ts";

export interface ReconnectParams {
  options: {
    /** Enables auto reconnect.
     *
     * Takes `boolean` or `{ attempts?: number, delay?: number }`.
     *
     * Default to `false`. */
    reconnect?: boolean | {
      /** Number of attempts before giving up.
       *
       * Default to `10` attempts. */
      attempts?: number;

      /** Delay between two attempts, in seconds.
       *
       * Default to `5` seconds. */
      delay?: number;
    };
  };

  events: {
    "reconnecting": RemoteAddr;
  };
}

const DEFAULT_ATTEMPTS = 10;
const DEFAULT_DELAY = 5;

export const reconnect: Plugin<ReconnectParams> = (client, options) => {
  let reconnect = options.reconnect ?? false;

  if (!reconnect) {
    return;
  }

  if (typeof reconnect === "boolean") {
    reconnect = {
      attempts: DEFAULT_ATTEMPTS,
      delay: DEFAULT_DELAY,
    };
  }

  const attempts = reconnect.attempts ?? DEFAULT_ATTEMPTS;
  const delay = reconnect.delay ?? DEFAULT_DELAY;

  let currentAttempts = 0;

  client.on("error", reconnectOnConnectError);
  client.on("raw", reconnectOnServerError);
  client.on("connecting", incrementAttempt);
  client.on("raw", resetAttempts);
  client.hooks.beforeCall("connect", requireErrorListener);

  function reconnectOnConnectError(error: ClientError) {
    if (error.type === "connect") {
      delayReconnect();
    }
  }

  function reconnectOnServerError(msg: Raw) {
    if (msg.command === "ERROR") {
      delayReconnect();
    }
  }

  function incrementAttempt() {
    currentAttempts++;
  }

  function resetAttempts(msg: Raw) {
    if (msg.command === "RPL_WELCOME") {
      currentAttempts = 0;
    }
  }

  let timeout: number | undefined;

  function delayReconnect() {
    clearTimeout(timeout);

    if (currentAttempts === attempts) {
      return;
    }

    const { remoteAddr } = client.state;
    const { hostname, port } = remoteAddr;

    client.emit("reconnecting", remoteAddr);

    timeout = setTimeout(
      async () => await client.connect(hostname, port),
      delay * 1000,
    );
  }

  function requireErrorListener() {
    if (client.count("error") > 0) {
      return;
    }

    client.emitError(
      "connect",
      "'reconnect' requires an error listener",
      requireErrorListener,
    );
  }
};
