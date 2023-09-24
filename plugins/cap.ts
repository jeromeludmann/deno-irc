import { createPlugin } from "../core/plugins.ts";

type AnyCapabilityCommand =
  | "LS"
  | "LIST"
  | "REQ"
  | "ACK"
  | "NAK"
  | "NEW"
  | "DEL"
  | "END";

interface CapFeatures {
  commands: {
    /** Sends a capability. */
    cap: (command: AnyCapabilityCommand, ...params: string[]) => void;
  };
  state: {
    capabilities: string[];
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

export default createPlugin("cap")<CapFeatures>((client) => {
  client.state.capabilities = [];

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

    for (const cap of requestedCaps) {
      client.cap("REQ", cap);
    }

    if (completeImmediately) client.cap("END");
  };

  client.utils.completeCapNegotiation = (): void => {
    if (requestedCaps.length === 0) return;
    client.cap("END");
  };
});
