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
  const source = {} as Source;
  const [name, user, host] = prefix.split(/[@!]+/);

  source.name = name;
  if (user !== undefined && host !== undefined) {
    source.mask = { user, host };
  }

  return source;
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
      if (pos === -1) pos = end;
      const [key, value] = raw.slice(start, pos).split("=");
      msg.tags[key] = value;
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

/** Stateful parser that handles incremental IRC message chunks split across TCP reads. */
export class Parser {
  private chunk = "";

  /**
   * Parses `chunks` of raw messages and provides a `Generator<Raw>`.
   *
   * `chunks` is a string of raw messages each ending with `\r\n`. If the last
   * raw message of the `batch` does not end with `\r\n`, it means the message
   * is not complete and will be temporarily stored in the `Parser` instance to
   * be processed on the next call.
   */
  *parseMessages(chunks: string): Generator<Raw> {
    this.chunk += chunks;
    const batch = this.chunk.split("\r\n");
    this.chunk = batch.pop()!;

    for (const raw of batch) {
      yield parseMessage(raw);
    }
  }
}
