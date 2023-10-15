import { createPlugin } from "../core/plugins.ts";
import { Queue } from "../deps.ts";

interface AntiFloodFeatures {
  options: {
    /** Milliseconds to wait between dispatching private messages.
     *
     * Defaults to 0 milliseconds (no delay) */
    floodDelay?: number;
  };
}

export default createPlugin("antiflood", [])<AntiFloodFeatures>(
  (client, options) => {
    if (!options.floodDelay || options.floodDelay <= 0) return;
    // Queue object and delay structure for anti-flood protection
    const queue = new Queue();
    const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

    // Queues up limiter for outgoing messages with before and after send hooks

    client.hooks.hookCall("send", async (send, command, ...params) => {
      if (command === "PRIVMSG") {
        return queue.push(async () => {
          const raw = await send(command, ...params);
          if (raw) {
            await delay(options.floodDelay);
          }
          return raw;
        });
      } else {
        return await send(command, ...params);
      }
    });
  },
);
