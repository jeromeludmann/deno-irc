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

const DEFAULT_RECONNECT = false;
const DEFAULT_ATTEMPTS = 10;
const DEFAULT_DELAY = 5;

export const reconnect: Plugin<ReconnectParams> = (client, options) => {
  let config = options.reconnect ?? DEFAULT_RECONNECT;

  if (!config) {
    return;
  }

  if (typeof config === "boolean") {
    config = {};
  }

  const {
    attempts = DEFAULT_ATTEMPTS,
    delay = DEFAULT_DELAY,
  } = config;

  let currentAttempts = 0;
  let timeout: number | undefined;

  const delayReconnect = () => {
    clearTimeout(timeout);

    if (currentAttempts === attempts) {
      return;
    }

    const { remoteAddr } = client.state;
    client.emit("reconnecting", remoteAddr);

    const { hostname, port } = remoteAddr;
    timeout = setTimeout(
      async () => await client.connect(hostname, port),
      delay * 1000,
    );
  };

  const reconnectOnConnectError = (error: ClientError) => {
    if (error.type === "connect") {
      delayReconnect();
    }
  };

  const reconnectOnServerError = (msg: Raw) => {
    if (msg.command === "ERROR") {
      delayReconnect();
    }
  };

  const incrementAttempt = () => {
    currentAttempts++;
  };

  const resetAttempts = (msg: Raw) => {
    if (msg.command === "RPL_WELCOME") {
      currentAttempts = 0;
    }
  };

  const requireErrorListener = () => {
    if (client.count("error") > 0) {
      return;
    }

    const error = "'reconnect' requires an error listener";
    client.emitError("connect", error, requireErrorListener);
  };

  client.on("error", reconnectOnConnectError);
  client.on("raw", reconnectOnServerError);
  client.on("connecting", incrementAttempt);
  client.on("raw", resetAttempts);
  client.hooks.beforeCall("connect", requireErrorListener);
};
