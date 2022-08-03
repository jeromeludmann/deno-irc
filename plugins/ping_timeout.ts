import { createPlugin } from "../core/plugins.ts";
import ping from "./ping.ts";
import register from "./register.ts";

interface PingTimeoutFeatures {
  options: {
    /** Maximum timeout before to be disconnected from server.
     *
     * Default to `30` seconds. `false` to disable. */
    pingTimeout?: number | false;
  };
}

const DEFAULT_PING_TIMEOUT = 30;

export default createPlugin(
  "ping_timeout",
  [ping, register],
)<PingTimeoutFeatures>((client, options) => {
  if (options.pingTimeout === false) {
    return;
  }

  const { pingTimeout = DEFAULT_PING_TIMEOUT } = options;

  let pingTimeoutId: number;
  let pingServerId: number;
  let started = false;

  function emitPingTimeout() {
    stopPingTimer();
    client.disconnect();
    client.emitError("read", "ERROR: Ping timeout", emitPingTimeout);
  }

  function pingServer() {
    client.ping();
    pingTimeoutId = setTimeout(emitPingTimeout, pingTimeout * 1000);
  }

  function startPingTimer() {
    if (!started) {
      started = true;
      pingServerId = setTimeout(pingServer, pingTimeout * 1000);
    }
  }

  function stopPingTimer() {
    if (!started) return;
    started = false;
    clearTimeout(pingServerId);
    clearTimeout(pingTimeoutId);
  }

  client.on("register", () => {
    startPingTimer();
  });

  client.on("raw", () => {
    if (started) {
      stopPingTimer();
      startPingTimer();
    }
  });

  client.on(["disconnected", "error"], () => {
    stopPingTimer();
  });
});
