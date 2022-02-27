import { createPlugin } from "../core/plugins.ts";
import mode from "./mode.ts";

interface ModeAliasesFeatures {
  commands: {
    /** Gives operator to `nick` on `channel`. */
    op(channel: string, nick: string, ...nicks: string[]): void;

    /** Takes operator from `nick` on `channel`. */
    deop(channel: string, nick: string, ...nicks: string[]): void;

    /** Gives half-operator to `nick` on `channel`. */
    halfop(channel: string, nick: string, ...nicks: string[]): void;

    /** Takes half-operator from `nick` on `channel`. */
    dehalfop(channel: string, nick: string, ...nicks: string[]): void;

    /** Gives voice to `nick` on `channel`. */
    voice(channel: string, nick: string, ...nicks: string[]): void;

    /** Takes voice from `nick` on `channel`. */
    devoice(channel: string, nick: string, ...nicks: string[]): void;

    /** Sets ban `mask` on `channel`. */
    ban(channel: string, mask: string, ...masks: string[]): void;

    /** Unsets ban `mask` on `channel`. */
    unban(channel: string, mask: string, ...masks: string[]): void;
  };
}

export default createPlugin(
  "mode_aliases",
  [mode],
)<ModeAliasesFeatures>((client) => {
  // OPER

  client.op = (channel, ...nicks) =>
    client.mode(channel, "+" + "o".repeat(nicks.length), ...nicks);

  client.deop = (channel, ...nicks) =>
    client.mode(channel, "-" + "o".repeat(nicks.length), ...nicks);

  // HALFOP

  client.halfop = (channel, ...nicks) =>
    client.mode(channel, "+" + "h".repeat(nicks.length), ...nicks);

  client.dehalfop = (channel, ...nicks) =>
    client.mode(channel, "-" + "h".repeat(nicks.length), ...nicks);

  // VOICE

  client.voice = (channel, ...nicks) =>
    client.mode(channel, "+" + "v".repeat(nicks.length), ...nicks);

  client.devoice = (channel, ...nicks) =>
    client.mode(channel, "-" + "v".repeat(nicks.length), ...nicks);

  // BAN

  client.ban = (channel, ...masks) =>
    client.mode(channel, "+" + "b".repeat(masks.length), ...masks);

  client.unban = (channel, ...masks) =>
    client.mode(channel, "-" + "b".repeat(masks.length), ...masks);
});
