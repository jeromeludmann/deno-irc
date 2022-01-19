import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface InviteEventParams {
  /** Nick who was invited. */
  nick: string;

  /** Channel where the nick was invited. */
  channel: string;
}

export type InviteEvent = Message<InviteEventParams>;

interface InviteFeatures {
  commands: {
    /** Invites a `nick` to a `channel`. */
    invite(nick: string, channel: string): void;
  };
  events: {
    "invite": InviteEvent;
  };
}

export default createPlugin("invite")<InviteFeatures>((client) => {
  // Sends INVITE command.
  client.invite = (nick, channel) => {
    client.send("INVITE", nick, channel);
  };

  // Emits 'invite' event.
  client.on("raw", (msg) => {
    if (msg.command === "INVITE") {
      const { source, params: [nick, channel] } = msg;
      client.emit("invite", { source, params: { nick, channel } });
    }
  });
});
