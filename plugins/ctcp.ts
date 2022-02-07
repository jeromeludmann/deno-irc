import { type Message, type Raw } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

const CTCP_COMMANDS = {
  ACTION: "action",
  CLIENTINFO: "clientinfo",
  PING: "ping",
  TIME: "time",
  VERSION: "version",
} as const;

type AnyRawCtcpCommand = keyof typeof CTCP_COMMANDS;
export type AnyCtcpCommand = typeof CTCP_COMMANDS[AnyRawCtcpCommand];

export interface RawCtcpEventParams {
  /** Target of the CTCP query.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Optional argument of the CTCP query. */
  arg?: string;
}

export type RawCtcpEvent = Message<RawCtcpEventParams> & {
  /** Name of the CTCP command. */
  command: AnyCtcpCommand;
};

export interface RawCtcpReplyEventParams {
  /** Argument of the CTCP reply. */
  arg: string;
}

export type RawCtcpReplyEvent = Message<RawCtcpReplyEventParams> & {
  /** Name of the CTCP command. */
  command: AnyCtcpCommand;
};

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
    ctcp(target: string, command: AnyRawCtcpCommand, param?: string): void;
  };
  events:
    & { [K in `raw_ctcp:${AnyCtcpCommand}`]: RawCtcpEvent }
    & { [K in `raw_ctcp:${AnyCtcpCommand}_reply`]: RawCtcpReplyEvent };
  utils: {
    isCtcp: (msg: Raw) => boolean;
    createCtcp: (command: AnyRawCtcpCommand, param?: string) => string;
  };
}

export default createPlugin("ctcp", [])<CtcpFeatures>((client) => {
  // Sends CTCP command.

  client.ctcp = (target, command, param) => {
    const ctcp = client.utils.createCtcp(command, param);
    client.send("PRIVMSG", target, ctcp);
  };

  // Emits 'raw:ctcp:*' events.

  client.on(["raw:privmsg", "raw:notice"], (msg) => {
    if (client.utils.isCtcp(msg)) {
      const { source, params: [target, rawCtcp] } = msg;

      // Parses raw CTCP

      const i = rawCtcp.indexOf(" ", 1);
      const rawCommand = rawCtcp.slice(1, i) as AnyRawCtcpCommand;
      const command = CTCP_COMMANDS[rawCommand];
      const param = i === -1 ? undefined : rawCtcp.slice(i + 1, -1);

      const type = msg.command === "privmsg" ? "" : "_reply";

      const ctcp: RawCtcpEvent = { source, command, params: { target } };
      if (param) ctcp.params.arg = param;

      client.emit(`raw_ctcp:${ctcp.command}${type}`, ctcp);
    }
  });

  // Utils.

  client.utils.isCtcp = (msg) => {
    const { params } = msg;
    return (
      // should have 2 parameters
      params.length === 2 &&
      // should be wrapped with '\x01'
      params[1].charAt(0) === "\x01" &&
      params[1].slice(-1) === "\x01"
    );
  };

  client.utils.createCtcp = (command, param) => {
    const ctcpParam = param === undefined ? "" : ` ${param}`;
    return `\x01${command}${ctcpParam}\x01`;
  };
});
