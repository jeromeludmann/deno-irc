import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters carried by an INVITE event. */
export interface InviteEventParams {
  /** Nick who was invited. */
  nick: string;

  /** Channel where the nick was invited. */
  channel: string;
}

/** Emitted when a user is invited to a channel. */
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

const plugin: Plugin<InviteFeatures> = createPlugin("invite")((client) => {
  // Sends INVITE command.
  client.invite = (nick, channel) => {
    client.send("INVITE", nick, channel);
  };

  // Emits 'invite' event.
  client.on("raw:invite", (msg) => {
    const { source, params: [nick, channel] } = msg;
    client.emit("invite", { source, params: { nick, channel } });
  });
});

export default plugin;
