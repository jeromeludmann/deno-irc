import { createPlugin } from "../core/plugins.ts";
import invite from "./invite.ts";
import join from "./join.ts";
import registration from "./registration.ts";

interface JoinOnInviteFeatures {
  options: {
    /** Enables auto join on invite. */
    joinOnInvite?: boolean;
  };
}

const JOIN_ON_INVITE_ENABLED = false;

export default createPlugin(
  "join_on_invite",
  [join, registration, invite],
)<JoinOnInviteFeatures>((client, options) => {
  const enabled = options.joinOnInvite ?? JOIN_ON_INVITE_ENABLED;
  if (!enabled) return;

  // Joins the channel when receiving INVITE message.
  client.on("invite", (msg) => {
    if (msg.params.nick === client.state.user.nick) {
      client.join(msg.params.channel);
    }
  });
});
