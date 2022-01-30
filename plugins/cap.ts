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
}

export default createPlugin("cap")<CapFeatures>((client) => {
  client.state.capabilities = [];

  // Sends CAP command.

  client.cap = (command, ...params) => {
    client.send("CAP", command, ...params);
  };
});
