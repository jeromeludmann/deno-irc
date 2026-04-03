import { type Message, type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";

/** An open batch being collected. */
export interface Batch {
  /** Server-assigned reference tag (without +/-). */
  ref: string;

  /** Batch type (e.g. "chathistory", "netsplit", "labeled-response"). */
  type: string;

  /** Additional parameters from the BATCH +ref line. */
  params: string[];

  /** Collected messages within this batch. */
  messages: Raw[];

  /** Tags from the opening BATCH +ref message. */
  tags?: Record<string, string | undefined>;

  /** Parent batch reference, if nested. */
  parentRef?: string;
}

/** Parameters carried by a batch_start event. */
export interface BatchStartEventParams {
  /** Server-assigned reference tag. */
  ref: string;

  /** Batch type. */
  type: string;

  /** Additional parameters. */
  params: string[];
}

/** Parameters carried by a batch_end event. */
export interface BatchEndEventParams {
  /** Server-assigned reference tag. */
  ref: string;

  /** Batch type. */
  type: string;

  /** Additional parameters from the opening line. */
  params: string[];

  /** All messages collected within this batch. */
  messages: Raw[];

  /** Tags from the opening BATCH +ref message. */
  tags?: Record<string, string | undefined>;
}

/** Emitted when a batch opens. */
export type BatchStartEvent = Message<BatchStartEventParams>;

/** Emitted when a batch closes with all collected messages. */
export type BatchEndEvent = Message<BatchEndEventParams>;

export interface BatchFeatures {
  events: {
    "batch_start": BatchStartEvent;
    "batch_end": BatchEndEvent;
  };
  state: {
    batches: Map<string, Batch>;
  };
}

const plugin: Plugin<BatchFeatures, AnyPlugins> = createPlugin(
  "batch",
  [cap],
)((client) => {
  client.state.caps.requested.push("batch");
  client.state.batches = new Map();

  // Intercept raw:* events to collect batched messages.

  client.hooks.hookCall("emit", (emit, event, ...args) => {
    if (
      typeof event === "string" &&
      event.startsWith("raw:") &&
      event !== "raw:batch"
    ) {
      const msg = args[0] as Raw | undefined;
      if (msg?.tags?.batch !== undefined) {
        const batch = client.state.batches.get(msg.tags.batch);
        if (batch) {
          batch.messages.push(msg);
          return;
        }
      }
    }
    return emit(event, ...args);
  });

  // Handle BATCH +ref and -ref.

  client.on("raw:batch", (msg) => {
    const { source, params, tags } = msg;
    const refParam = params[0];
    if (!refParam) return;

    const sign = refParam[0];
    const ref = refParam.slice(1);

    if (sign === "+") {
      const [type, ...batchParams] = params.slice(1);

      const batch: Batch = {
        ref,
        type: type ?? "",
        params: batchParams,
        messages: [],
        tags,
        parentRef: tags?.batch,
      };

      client.state.batches.set(ref, batch);

      client.emit("batch_start", {
        source,
        params: { ref, type: type ?? "", params: batchParams },
      });
    } else if (sign === "-") {
      const batch = client.state.batches.get(ref);
      if (!batch) return;

      client.state.batches.delete(ref);

      client.emit("batch_end", {
        source,
        params: {
          ref,
          type: batch.type,
          params: batch.params,
          messages: batch.messages,
          tags: batch.tags,
        },
      });
    }
  });

  // Cleanup on disconnect.

  client.on("disconnected", () => {
    client.state.batches.clear();
  });
});

export default plugin;
