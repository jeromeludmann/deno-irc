import {
  type AnyCommand,
  type AnyErrorReply,
  type AnyReply,
  IRC_NUMERICS,
} from "./protocol.ts";

export interface Mask {
  /** Username of the user. */
  user: string;

  /** Hostname of the user. */
  host: string;
}

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
  /** Source of the message.
   *
   * Optional. If undefined, always related to a server. */
  source?: Source;

  /** Parameters of the message. */
  params: TParams;
}

export type Raw = Message<string[]> & {
  /** Command of the message. */
  command: AnyCommand | AnyReply | AnyErrorReply;
};

export const parseSource = (prefix: string): Source => {
  const source = {} as Source;
  const [name, user, host] = prefix.split(/[@!]+/);

  source.name = name;
  if (user !== undefined && host !== undefined) {
    source.mask = { user, host };
  }

  return source;
};

// The following is called on each received raw message
// and must favor performance over readability.
const parseMessage = (raw: string): Raw => {
  const msg = {} as Raw;

  // Indexes used to move through the raw string
  let start = 0;
  let end: number;

  // Tags are ignored for now
  if (raw[start] === "@") {
    end = raw.indexOf(" ", ++start);
    start = end + 1;
  }

  // Prefix parsing
  if (raw[start] === ":") {
    end = raw.indexOf(" ", ++start);
    const prefix = raw.slice(start, end);
    msg.source = parseSource(prefix);
    start = end + 1;
  }

  // Command parsing
  end = raw.indexOf(" ", start);
  if (end === -1) end = raw.length;
  const command = raw.slice(start, end);
  msg.command = command in IRC_NUMERICS
    ? (IRC_NUMERICS as Record<string, AnyReply | AnyErrorReply>)[command]
    : command as AnyCommand;
  start = end + 1;

  // Params parsing
  msg.params = [];
  while (start < raw.length && raw[start] !== ":") {
    end = raw.indexOf(" ", start);
    if (end === -1) end = raw.length;
    const middle = raw.slice(start, end);
    msg.params.push(middle);
    start = end + 1;
  }
  if (start < raw.length) {
    const trailing = raw.slice(++start).trimEnd();
    msg.params.push(trailing);
  }

  return msg;
};

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
    this.chunk = batch.pop() ?? "";

    for (const raw of batch) {
      yield parseMessage(raw);
    }
  }
}
