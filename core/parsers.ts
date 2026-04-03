import {
  type AnyCommand,
  type AnyError,
  type AnyRawCommand,
  type AnyRawError,
  type AnyRawReply,
  type AnyReply,
  PROTOCOL,
} from "./protocol.ts";

/** User identity mask with username and hostname. */
export interface Mask {
  /** Username of the user. */
  user: string;

  /** Hostname of the user. */
  host: string;
}

/** Origin of an IRC message, either a server or a user. */
export interface Source {
  /** Server name or user nick. */
  name: string;

  /** User mask containing user and host names.
   *
   * Optional for users, always undefined for server. */
  mask?: Mask;
}

/** Helper used to create message shapes. */
export interface Message<TParams> {
  tags?: Record<string, string | undefined>;

  /** Source of the message.
   *
   * Optional. If undefined, always related to a server. */
  source?: Source;

  /** Parameters of the message. */
  params: TParams;
}

/** A parsed IRC message with its command resolved to a human-readable name. */
export type Raw = Message<string[]> & {
  /** Command of the message.
   *
   * Translated from raw command to be understandable by human. */
  command: AnyCommand | AnyReply | AnyError;
};

/** Parses an IRC prefix string (e.g. `nick!user@host`) into a {@link Source}. */
export function parseSource(prefix: string): Source {
  const bangIdx = prefix.indexOf("!");
  const atIdx = prefix.indexOf("@");

  if (bangIdx !== -1 && atIdx > bangIdx) {
    return {
      name: prefix.slice(0, bangIdx),
      mask: {
        user: prefix.slice(bangIdx + 1, atIdx),
        host: prefix.slice(atIdx + 1),
      },
    };
  }

  return { name: prefix };
}

const UNESCAPE_MAP: Record<string, string> = {
  ":": ";",
  "s": " ",
  "\\": "\\",
  "r": "\r",
  "n": "\n",
};

/** Decodes IRCv3 tag value escaping. */
export function unescapeTagValue(value: string): string {
  if (value.indexOf("\\") === -1) return value;
  let result = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "\\" && i + 1 < value.length) {
      result += UNESCAPE_MAP[value[++i]] ?? value[i];
    } else {
      result += value[i];
    }
  }
  return result;
}

/** Encodes a string as an IRCv3 tag value. */
export function escapeTagValue(value: string): string {
  return value.replace(/[; \\\r\n]/g, (c) => {
    switch (c) {
      case ";":
        return "\\:";
      case " ":
        return "\\s";
      case "\\":
        return "\\\\";
      case "\r":
        return "\\r";
      case "\n":
        return "\\n";
      default:
        return c;
    }
  });
}

// The following is called on each received raw message
// and must favor performance over readability.
function parseMessage(raw: string): Raw {
  const msg = {} as Raw;

  // Indexes used to move through the raw string

  let start = 0;
  let end: number;

  // Parses message tags.

  if (raw[start] === "@") {
    end = raw.indexOf(" ", ++start);
    msg.tags = {};
    while (start < end) {
      let pos = raw.indexOf(";", start);
      if (pos === -1 || pos > end) pos = end;
      const eqIdx = raw.indexOf("=", start);
      if (eqIdx !== -1 && eqIdx < pos) {
        msg.tags[raw.slice(start, eqIdx)] = unescapeTagValue(
          raw.slice(eqIdx + 1, pos),
        );
      } else {
        msg.tags[raw.slice(start, pos)] = undefined;
      }
      start = pos + 1;
    }
  }

  // Parses message prefix.
  // User prefixes can be formatted as `nick!user@host`.

  if (raw[start] === ":") {
    end = raw.indexOf(" ", ++start);
    const prefix = raw.slice(start, end);
    msg.source = parseSource(prefix);
    start = end + 1;
  }

  // Parses message command.

  end = raw.indexOf(" ", start);
  if (end === -1) end = raw.length;
  const command = raw.slice(start, end);
  msg.command =
    PROTOCOL.ALL[command as AnyRawCommand | AnyRawReply | AnyRawError];
  start = end + 1;

  // Parses message parameters.

  msg.params = [];
  while (start < raw.length && raw[start] !== ":") {
    end = raw.indexOf(" ", start);
    if (end === -1) end = raw.length;
    msg.params.push(raw.slice(start, end));
    start = end + 1;
  }
  if (start < raw.length) {
    msg.params.push(raw.slice(++start).trimEnd());
  }

  return msg;
}

/**
 * Parses raw IRC messages from `input` and returns parsed messages with any
 * incomplete trailing chunk.
 *
 * `input` is a string of raw messages each ending with `\r\n`. If the last
 * raw message does not end with `\r\n`, it is returned as the remainder to
 * be prepended to the next call.
 */
export function parseChunk(input: string): [Raw[], string] {
  const results: Raw[] = [];

  let start = 0;
  let end: number;

  while ((end = input.indexOf("\r\n", start)) !== -1) {
    results.push(parseMessage(input.slice(start, end)));
    start = end + 2; // skip \r\n
  }

  return [results, start < input.length ? input.slice(start) : ""];
}
