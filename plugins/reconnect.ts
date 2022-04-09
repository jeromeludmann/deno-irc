import { RemoteAddr } from "../core/client.ts";
import { createPlugin } from "../core/plugins.ts";
import register from "./register.ts";

interface ReconnectFeatures {
  options: {
    /** Enables auto reconnect.
     *
     * Takes `boolean` or `{ attempts?: number, delay?: number }`.
     *
     * Default to `false` or `{ attempts: 10, delay: 5 }` if set to `true`. */
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

export default createPlugin(
  "reconnect",
  [register],
)<ReconnectFeatures>((client, options) => {
  let config = options.reconnect ?? DEFAULT_RECONNECT;
  if (!config) return;

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
    if (currentAttempts === attempts) return;

    const { remoteAddr } = client.state;
    client.emit("reconnecting", remoteAddr);

    const { hostname, port, tls } = remoteAddr;
    timeout = setTimeout(
      async () => await client.connect(hostname, port, tls),
      delay * 1000,
    );
  };

  // Reconnects on connect error.

  client.on("error", (error) => {
    if (error.type === "connect") {
      delayReconnect();
    }
  });

  // Reconnects on server error.

  client.on("raw:error", () => {
    delayReconnect();
  });

  // Increments attempts.

  client.on("connecting", () => {
    currentAttempts++;
  });

  // Resets attempts

  client.on("register", () => {
    currentAttempts = 0;
  });

  // Make error listener required.

  const requireErrorListener = () => {
    if (client.count("error") > 0) return;
    const error = "plugins/reconnect requires an error listener";
    client.emitError("connect", error, requireErrorListener);
  };
  client.hooks.beforeCall("connect", requireErrorListener);
});
