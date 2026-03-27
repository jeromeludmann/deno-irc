import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

type AnyCapabilityCommand =
  | "LS"
  | "LIST"
  | "REQ"
  | "ACK"
  | "NAK"
  | "NEW"
  | "DEL"
  | "END";

/** Parameters carried by a CAP event. */
export interface CapEventParams {
  /** Space-separated list of capabilities. */
  caps: string[];
}

/** Emitted when the server acknowledges, rejects, adds or removes capabilities. */
export type CapEvent = Message<CapEventParams>;

interface CapFeatures {
  commands: {
    /** Sends a capability. */
    cap: (command: AnyCapabilityCommand, ...params: string[]) => void;
  };
  state: {
    capabilities: string[];
    availableCapabilities: Set<string>;
    enabledCapabilities: Set<string>;
  };
  events: {
    "cap:ack": CapEvent;
    "cap:nak": CapEvent;
    "cap:new": CapEvent;
    "cap:del": CapEvent;
  };
  utils: {
    /** Sends CAP LS 302, filters against server-advertised capabilities,
     * then sends CAP REQ for the intersection.
     *
     * Optionally takes additional capabilities in argument. */
    negotiateCapabilities: (options?: CapNegotiationOptions) => void;
    completeCapNegotiation: () => void;
  };
}

interface CapNegotiationOptions {
  completeImmediately?: boolean;
  extraCaps?: string[];
}

const plugin: Plugin<CapFeatures> = createPlugin("cap")((client) => {
  client.state.capabilities = [];
  client.state.availableCapabilities = new Set();
  client.state.enabledCapabilities = new Set();

  // Always request cap-notify for dynamic cap management.
  client.state.capabilities.push("cap-notify");

  // Sends CAP command.

  client.cap = (command, ...params) => {
    client.send("CAP", command, ...params);
  };

  // Provides util to send capabilities
  // (currently triggered by plugins/registration)
  let completeAfterAck = false;

  client.utils.negotiateCapabilities = (options?: CapNegotiationOptions) => {
    const { completeImmediately = false, extraCaps = [] } = options || {};
    const wanted = [...client.state.capabilities, ...extraCaps];
    if (wanted.length === 0) return;

    completeAfterAck = completeImmediately;

    // Accumulate CAP LS 302 (may be multiline with * marker).
    const lsCaps: string[] = [];

    const onLs = (msg: { params: string[] }) => {
      const [, subcommand, ...rest] = msg.params;
      if (subcommand?.toUpperCase() !== "LS") return;

      // CAP LS 302 multiline: "* :<caps>" for continuation, ":<caps>" for final.
      const isMultiline = rest[0] === "*";
      const capString = isMultiline ? rest[1] : rest[0];
      const caps = (capString ?? "").trim().split(/\s+/).filter(Boolean);

      for (const cap of caps) {
        // Strip capability values (e.g. "sasl=PLAIN,EXTERNAL" → "sasl").
        lsCaps.push(cap.split("=")[0]);
      }

      if (!isMultiline) {
        client.off("raw:cap", onLs);

        for (const cap of lsCaps) {
          client.state.availableCapabilities.add(cap);
        }

        // Only request caps that the server actually supports.
        const supported = wanted.filter((c) =>
          client.state.availableCapabilities.has(c)
        );
        if (supported.length > 0) {
          client.cap("REQ", supported.join(" "));
        } else if (completeAfterAck) {
          completeAfterAck = false;
          client.cap("END");
        }
      }
    };

    client.on("raw:cap", onLs);
    client.cap("LS", "302");
  };

  client.utils.completeCapNegotiation = (): void => {
    client.cap("END");
  };

  // Track CAP ACK/NAK/NEW/DEL from server.

  client.on("raw:cap", (msg) => {
    const [, subcommand, ...rest] = msg.params;
    const sub = subcommand?.toUpperCase();

    if (sub === "ACK") {
      const caps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      for (const cap of caps) {
        client.state.enabledCapabilities.add(cap);
      }
      client.emit("cap:ack", { source: msg.source, params: { caps } });
      if (completeAfterAck) {
        completeAfterAck = false;
        client.cap("END");
      }
    }

    if (sub === "NAK") {
      const caps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      client.emit("cap:nak", { source: msg.source, params: { caps } });
      if (completeAfterAck) {
        completeAfterAck = false;
        client.cap("END");
      }
    }

    if (sub === "NEW") {
      const rawCaps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      const caps = rawCaps.map((c) => c.split("=")[0]);
      client.emit("cap:new", { source: msg.source, params: { caps } });
      for (const cap of caps) {
        client.state.availableCapabilities.add(cap);
      }
      // Auto-request caps that were declared by plugins.
      for (const cap of caps) {
        if (client.state.capabilities.includes(cap)) {
          client.cap("REQ", cap);
        }
      }
    }

    if (sub === "DEL") {
      const caps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      for (const cap of caps) {
        client.state.enabledCapabilities.delete(cap);
        client.state.availableCapabilities.delete(cap);
      }
      client.emit("cap:del", { source: msg.source, params: { caps } });
    }
  });
});

export default plugin;
