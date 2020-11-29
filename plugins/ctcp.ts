import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface CtcpParams {
  commands: {
    /** Sends a CTCP message to a `target` with a `command` and a `param`. */
    ctcp(target: string, command: AnyCtcpCommand, param?: string): void;
  };

  events: {
    "ctcp": Ctcp;
  };
}

export type AnyCtcpCommand =
  | "ACTION"
  | "CLIENTINFO"
  | "PING"
  | "TIME"
  | "VERSION";

export interface Ctcp {
  /** User who sent the CTCP. */
  origin: UserMask;

  /** Target who received the CTCP. */
  target: string;

  /** Name of the CTCP command. */
  command: AnyCtcpCommand;

  /** Type of the CTCP (`"query"` or `"reply"`). */
  type: "query" | "reply";

  /** Optional param of the CTCP. */
  param?: string;
}

export const ctcp: Plugin<CtcpParams> = (client) => {
  client.ctcp = sendCtcp;
  client.on("raw", emitCtcp);

  function sendCtcp(target: string, command: string, param: string) {
    client.send("PRIVMSG", target, createCtcp(command, param));
  }

  function emitCtcp(msg: Raw) {
    if (!isCtcp(msg)) {
      return;
    }

    const { command, params } = msg;
    const [target, rawCtcp] = params;

    const i = rawCtcp.indexOf(" ", 1);
    const ctcpCommand = rawCtcp.slice(1, i) as AnyCtcpCommand;
    const ctcpParam = i === -1 ? undefined : rawCtcp.slice(i + 1, -1);

    const ctcp: Ctcp = {
      origin: parseUserMask(msg.prefix),
      target,
      command: ctcpCommand,
      type: command === "PRIVMSG" ? "query" : "reply",
    };

    if (ctcpParam) {
      ctcp.param = ctcpParam;
    }

    client.emit("ctcp", ctcp);
  }
};

export function isCtcp(msg: Raw): boolean {
  const { params } = msg;

  if (params.length !== 2) {
    return false;
  }

  if (
    params[1][0] !== "\x01" ||
    params[1][params[1].length - 1] !== "\x01"
  ) {
    return false;
  }

  if (
    msg.command !== "PRIVMSG" &&
    msg.command !== "NOTICE"
  ) {
    return false;
  }

  return true;
}

export function createCtcp(command: string, param?: string): string {
  const ctcpParam = param === undefined ? "" : ` ${param}`;
  return `\x01${command}${ctcpParam}\x01`;
}
