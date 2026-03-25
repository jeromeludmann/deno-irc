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
    enabledCapabilities: Set<string>;
  };
  events: {
    "cap:ack": CapEvent;
    "cap:nak": CapEvent;
    "cap:new": CapEvent;
    "cap:del": CapEvent;
  };
  utils: {
    /** Sends CAP sequence with existing capabilities.
     *
     * Optionaly, takes additional capabilities in argument. */
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
  client.state.enabledCapabilities = new Set();

  // Always request cap-notify for dynamic cap management.
  client.state.capabilities.push("cap-notify");

  // Sends CAP command.

  client.cap = (command, ...params) => {
    client.send("CAP", command, ...params);
  };

  // Provides util to send capabilities
  // (currently triggered by plugins/registration)
  let requestedCaps: string[] = [];

  client.utils.negotiateCapabilities = (options?: CapNegotiationOptions) => {
    const { completeImmediately = false, extraCaps = [] } = options || {};
    requestedCaps = [...client.state.capabilities, ...extraCaps];
    if (requestedCaps.length === 0) return;

    client.cap("REQ", requestedCaps.join(" "));

    if (completeImmediately) client.cap("END");
  };

  client.utils.completeCapNegotiation = (): void => {
    if (requestedCaps.length === 0) return;
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
    }

    if (sub === "NAK") {
      const caps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      client.emit("cap:nak", { source: msg.source, params: { caps } });
    }

    if (sub === "NEW") {
      const caps = (rest[0] ?? "").trim().split(/\s+/).filter(Boolean);
      client.emit("cap:new", { source: msg.source, params: { caps } });
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
      }
      client.emit("cap:del", { source: msg.source, params: { caps } });
    }
  });
});

export default plugin;
