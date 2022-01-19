import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface MotdEventParams {
  /** Message of the day (MOTD). */
  motd?: string[];
}

export type MotdEvent = Message<MotdEventParams>;

interface MotdFeatures {
  commands: {
    /** Gets the message of the day (MOTD) of the server. */
    motd(): void;
  };
  events: {
    "motd": MotdEvent;
  };
}

export default createPlugin("motd")<MotdFeatures>((client) => {
  const motd: string[] = [];

  // Sends MOTD command.
  client.motd = () => {
    client.send("MOTD");
  };

  // Emits 'motd' event once MOTD is fully received.
  client.on("raw", (msg) => {
    switch (msg.command) {
      case "RPL_MOTDSTART": {
        motd.length = 0;
        break;
      }
      case "RPL_MOTD": {
        const { params: [, text] } = msg;
        motd.push(text);
        break;
      }
      case "RPL_ENDOFMOTD": {
        const { source } = msg;
        client.emit("motd", { source, params: { motd } });
        break;
      }
      case "ERR_NOMOTD": {
        const { source } = msg;
        const motd = undefined;
        client.emit("motd", { source, params: { motd } });
        break;
      }
    }
  });
});
