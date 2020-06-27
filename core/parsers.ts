import { AnyCommand, AnyNumeric, IRC_NUMERICS } from "./protocol.ts";

export class Parser {
  private chunk = "";

  *parseMessages(chunks: string): Generator<Raw> {
    this.chunk += chunks;
    const batch = this.chunk.split("\r\n");
    this.chunk = batch.pop() ?? "";

    for (const raw of batch) {
      yield parseMessage(raw);
    }
  }
}

export interface Raw {
  prefix: string;
  command: AnyCommand | AnyNumeric;
  params: string[];
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

export interface UserMask {
  nick: string;
  username: string;
  userhost: string;
}

export function parseUserMask(prefix: string): UserMask {
  const usermask = prefix.match(/^(.+)!(.+)@(.+)$/);
  if (usermask === null) {
    throw new Error(`Not a user mask: ${prefix}`);
  }
  const [, nick, username, userhost] = usermask;
  return { nick, username, userhost };
}
