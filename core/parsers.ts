import { AnyCommand, AnyNumeric, IRC_NUMERICS } from "./protocol.ts";

/** Main parser used by the core client. */
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

/** Raw shape of an IRC message. */
export interface Raw {
  /** Prefix of the message. */
  prefix: string;
  /** Command of the message. */
  command: AnyCommand | AnyNumeric;
  /** Parameters of the message. */
  params: string[];
  /** Original raw string. */
  raw: string;
}

function parseMessage(raw: string): Raw {
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
    msg.prefix = raw.slice(start, end);
    start = end + 1;
  } else {
    msg.prefix = "";
  }

  // Command parsing
  end = raw.indexOf(" ", start);
  if (end === -1) end = raw.length;
  const command = raw.slice(start, end);
  msg.command = command in IRC_NUMERICS
    ? (IRC_NUMERICS as Record<string, AnyNumeric>)[command]
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
    const trailing = raw.slice(++start).trimRight();
    msg.params.push(trailing);
  }

  // Keep the original raw string
  msg.raw = raw;

  return msg;
}

/** User mask containing the nickname, the username and the userhost. */
export interface UserMask {
  nick: string;
  username: string;
  userhost: string;
}

/** Gets a user mask object from a prefix string. */
export function parseUserMask(prefix: string): UserMask {
  const usermask = prefix.match(/^(.+)!(.+)@(.+)$/);
  if (usermask === null) {
    throw new Error(`Not a user mask: ${prefix}`);
  }
  const [, nick, username, userhost] = usermask;
  return { nick, username, userhost };
}
