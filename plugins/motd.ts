import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface MotdEventParams {
  /** Message of the day (MOTD). */
  motd?: string[];
}

export type MotdEvent = Message<MotdEventParams>;

interface MotdFeatures {
  commands: {
    /** Gets the message of the day (MOTD) of the server.
     *
     * Replies with 'motd_reply' event when ended. */
    motd(): void;
  };
  events: {
    "motd_reply": MotdEvent;
  };
}

export default createPlugin("motd")<MotdFeatures>((client) => {
  const motd: string[] = [];

  // Sends MOTD command.

  client.motd = () => {
    client.send("MOTD");
  };

  // Emits 'motd' event once MOTD is fully received.

  client.on("raw:rpl_motdstart", () => {
    motd.length = 0;
  });

  client.on("raw:rpl_motd", (msg) => {
    const { params: [, text] } = msg;
    motd.push(text);
  });

  client.on("raw:rpl_endofmotd", (msg) => {
    const { source } = msg;
    client.emit("motd_reply", { source, params: { motd } });
  });

  client.on("raw:err_nomotd", (msg) => {
    const { source } = msg;
    const motd = undefined;
    client.emit("motd_reply", { source, params: { motd } });
  });
});
