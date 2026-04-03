import { type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import mode from "./mode.ts";
import register from "./register.ts";
import registration from "./registration.ts";

export interface BotModeFeatures {
  options: {
    /** Whether this client is a bot. When true, requests draft/bot-mode
     *  and automatically sets user mode +B after registration.
     *
     *  Defaults to `false`. */
    bot?: boolean;
  };
  utils: {
    /** Returns true if the message was sent by a bot
     *  (has the `bot` or `draft/bot` tag). */
    isBot: (msg: Raw) => boolean;
  };
}

const plugin: Plugin<BotModeFeatures, AnyPlugins> = createPlugin(
  "bot_mode",
  [cap, mode, register, registration],
)((client, options) => {
  client.utils.isBot = (msg) => {
    if (!msg.tags) return false;
    return "bot" in msg.tags || "draft/bot" in msg.tags;
  };

  if (options.bot) {
    client.state.caps.requested.push("draft/bot-mode");
    client.state.caps.requested.push("bot-mode");

    client.on("register", () => {
      client.mode(client.state.user.nick, "+B");
    });
  }
});

export default plugin;
