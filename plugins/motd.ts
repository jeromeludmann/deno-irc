import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export interface MotdParams {
  commands: {
    /** Gets the message of the day (MOTD) of the server. */
    motd(): void;
  };

  events: {
    "motd": Motd;
  };
}

export interface Motd {
  /** Message of the day (MOTD). */
  motd?: string[];
}

export const motd: Plugin<MotdParams> = (client) => {
  let motd: string[] = [];

  client.motd = sendMotd;
  client.on("raw", emitMotd);

  function sendMotd(...params: string[]) {
    client.send("MOTD", ...params);
  }

  function emitMotd(msg: Raw) {
    switch (msg.command) {
      case "RPL_MOTDSTART":
        return motd = [];

      case "RPL_MOTD":
        const [, text] = msg.params;
        return motd.push(text);

      case "RPL_ENDOFMOTD":
        return client.emit("motd", { motd: motd });

      case "ERR_NOMOTD":
        return client.emit("motd", { motd: undefined });
    }
  }
};
