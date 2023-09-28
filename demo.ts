import { Client } from "./mod.ts";

const client = new Client({
  nick: "totoche",
  verbose: (log) => {
    if (log.type === "event") {
      if (log.event === "join") {
        log.payload;
      } else if (log.event === "fdfdfs") {
        log.payload;
      }
    }
  },
});

client.connect("irc.libera.chat");

client.on("")
