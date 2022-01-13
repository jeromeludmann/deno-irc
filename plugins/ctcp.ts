import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export type AnyCtcpCommand =
  | "ACTION"
  | "CLIENTINFO"
  | "PING"
  | "TIME"
  | "VERSION";

export interface CtcpEvent {
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

export interface CtcpParams {
  commands: {
    /** Sends a CTCP message to a `target` with a `command` and a `param`. */
    ctcp(target: string, command: AnyCtcpCommand, param?: string): void;
  };
  events: {
    "ctcp": CtcpEvent;
  };
}

export const ctcpPlugin: Plugin<CtcpParams> = (client) => {
  const sendCtcp = (target: string, command: string, param: string) => {
    const ctcp = createCtcp(command, param);
    client.send("PRIVMSG", target, ctcp);
  };

  const emitCtcp = (msg: Raw) => {
    if (!isCtcp(msg)) {
      return;
    }

    const ctcp = parseCtcp(msg);
    client.emit("ctcp", ctcp);
  };

  client.ctcp = sendCtcp;
  client.on("raw", emitCtcp);
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

function parseCtcp(msg: Raw): CtcpEvent {
  const { command, params: [target, rawCtcp] } = msg;

  const i = rawCtcp.indexOf(" ", 1);
  const ctcpCommand = rawCtcp.slice(1, i) as AnyCtcpCommand;
  const ctcpParam = i === -1 ? undefined : rawCtcp.slice(i + 1, -1);

  const ctcp: CtcpEvent = {
    origin: parseUserMask(msg.prefix),
    target,
    command: ctcpCommand,
    type: command === "PRIVMSG" ? "query" : "reply",
  };

  if (ctcpParam) {
    ctcp.param = ctcpParam;
  }

  return ctcp;
}
