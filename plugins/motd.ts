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
  const motd: string[] = [];

  const sendMotd = (...params: string[]) => {
    client.send("MOTD", ...params);
  };

  const emitMotd = (msg: Raw) => {
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
        client.emit("motd", { motd });
        break;
      }
      case "ERR_NOMOTD": {
        const motd = undefined;
        client.emit("motd", { motd });
        break;
      }
    }
  };

  client.motd = sendMotd;
  client.on("raw", emitMotd);
};
