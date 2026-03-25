import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import privmsg from "./privmsg.ts";
import notice from "./notice.ts";
import registration from "./registration.ts";

interface MessageSplitFeatures {
  options: {
    /** Enable auto-splitting of long messages. Default: `true`. */
    messageSplit?: boolean;
  };
}

const IRC_MAX_LENGTH = 512;
// :nick!user@host PRIVMSG target :text\r\n
// Conservative prefix estimate when real host is unknown.
const DEFAULT_HOST_LENGTH = 63;
const CRLF_LENGTH = 2;

function splitMessage(text: string, maxBytes: number): string[] {
  if (maxBytes <= 0) return [text];

  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= maxBytes) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const bytes = encoder.encode(remaining);
    if (bytes.length <= maxBytes) {
      parts.push(remaining);
      break;
    }

    // Find the char index that fits within maxBytes.
    let charLimit = remaining.length;
    while (
      charLimit > 0 &&
      encoder.encode(remaining.slice(0, charLimit)).length > maxBytes
    ) {
      charLimit--;
    }

    // Try to split on word boundary within the byte limit.
    const wordSplit = remaining.lastIndexOf(" ", charLimit);

    if (wordSplit > 0) {
      parts.push(remaining.slice(0, wordSplit));
      remaining = remaining.slice(wordSplit + 1); // skip the space
    } else {
      // Hard split at the byte boundary.
      parts.push(remaining.slice(0, charLimit));
      remaining = remaining.slice(charLimit);
    }
  }

  return parts;
}

function calcOverhead(
  nick: string,
  username: string,
  hostname: string,
  command: string,
  target: string,
): number {
  // :nick!username@hostname COMMAND target :\r\n
  return 1 + nick.length + 1 + username.length + 1 + hostname.length +
    1 + command.length + 1 + target.length + 2 + CRLF_LENGTH;
}

const plugin: Plugin<MessageSplitFeatures, AnyPlugins> = createPlugin(
  "message_split",
  [privmsg, notice, registration],
)((client, options) => {
  if (options.messageSplit === false) return;

  let hostname = "x".repeat(DEFAULT_HOST_LENGTH);

  // Track real hostname from RPL_HOSTHIDDEN (396).
  client.on("raw:rpl_hosthidden", (msg) => {
    const [, host] = msg.params;
    if (host) hostname = host;
  });

  // Hook privmsg to auto-split.

  client.hooks.hookCall("privmsg", (privmsg, target, text) => {
    const { nick, username } = client.state.user;
    const overhead = calcOverhead(nick, username, hostname, "PRIVMSG", target);
    const maxBytes = IRC_MAX_LENGTH - overhead;
    for (const part of splitMessage(text, maxBytes)) {
      privmsg(target, part);
    }
  });

  // Hook notice to auto-split.

  client.hooks.hookCall("notice", (notice, target, text) => {
    const { nick, username } = client.state.user;
    const overhead = calcOverhead(nick, username, hostname, "NOTICE", target);
    const maxBytes = IRC_MAX_LENGTH - overhead;
    for (const part of splitMessage(text, maxBytes)) {
      notice(target, part);
    }
  });
});

export default plugin;
