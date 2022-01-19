import { type Message, type Raw } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export type AnyCtcpCommand =
  | "ACTION"
  | "CLIENTINFO"
  | "PING"
  | "TIME"
  | "VERSION";

export interface CtcpEventParams {
  /** Target of the CTCP.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Type of the CTCP (`"query"` or `"reply"`). */
  type: "query" | "reply";

  /** Optional param of the CTCP. */
  param?: string;
}

export type CtcpEvent = Message<CtcpEventParams> & {
  /** Name of the CTCP command. */
  command: AnyCtcpCommand;
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

export function createCtcp(command: AnyCtcpCommand, param?: string): string {
  const ctcpParam = param === undefined ? "" : ` ${param}`;
  return `\x01${command}${ctcpParam}\x01`;
}

interface CtcpFeatures {
  commands: {
    /** Sends a CTCP message to a `target` with a `command` and a `param`.
     *
     * For easier use, see also other CTCP-derived methods:
     * - `action`
     * - `clientinfo`
     * - `ping`
     * - `time`
     * - `version` */
    ctcp(target: string, command: AnyCtcpCommand, param?: string): void;
  };
  events: {
    "ctcp": CtcpEvent;
  };
}

export default createPlugin("ctcp", [])<CtcpFeatures>((client) => {
  // Sends CTCP command.
  client.ctcp = (target, command, param) => {
    const ctcp = createCtcp(command, param);
    client.send("PRIVMSG", target, ctcp);
  };

  // Emits 'ctcp' event.
  client.on("raw", (msg) => {
    if (!isCtcp(msg)) return;
    const { source, params: [target, rawCtcp] } = msg;

    const i = rawCtcp.indexOf(" ", 1);
    const command = rawCtcp.slice(1, i) as AnyCtcpCommand;
    const ctcpParam = i === -1 ? undefined : rawCtcp.slice(i + 1, -1);
    const type = msg.command === "PRIVMSG" ? "query" : "reply";

    const ctcp: CtcpEvent = { source, command, params: { target, type } };
    if (ctcpParam) ctcp.params.param = ctcpParam;

    client.emit("ctcp", ctcp);
  });
});
