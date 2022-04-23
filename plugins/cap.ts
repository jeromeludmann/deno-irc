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
    sendCapabilities: (...capabilities: string[]) => void;
  };
}

export default createPlugin("cap")<CapFeatures>((client) => {
  client.state.capabilities = [];

  // Sends CAP command.

  client.cap = (command, ...params) => {
    client.send("CAP", command, ...params);
  };

  // Provides util to send capabilities
  // (currently triggered by plugins/registration)

  client.utils.sendCapabilities = (...capabilities: string[]): void => {
    const caps = [...client.state.capabilities, ...capabilities];

    if (caps.length === 0) {
      return;
    }

    for (const cap of caps) {
      client.cap("REQ", cap);
    }

    client.cap("END");
  };
});
