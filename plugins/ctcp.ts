import { type Message, type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";

const CTCP_COMMANDS = {
  ACTION: "action",
  DCC: "dcc",
  CLIENTINFO: "clientinfo",
  PING: "ping",
  TIME: "time",
  VERSION: "version",
} as const;

type AnyRawCtcpCommand = keyof typeof CTCP_COMMANDS;
/** Union of lowercase CTCP command names (e.g., "action", "ping", "version"). */
export type AnyCtcpCommand = typeof CTCP_COMMANDS[AnyRawCtcpCommand];

/** Parameters for a raw incoming CTCP query event. */
export interface RawCtcpEventParams {
  /** Target of the CTCP query.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Optional argument of the CTCP query. */
  arg?: string;
}

/** Event emitted for an incoming CTCP query (via PRIVMSG). */
export type RawCtcpEvent = Message<RawCtcpEventParams> & {
  /** Name of the CTCP command. */
  command: AnyCtcpCommand;
};

/** Parameters for a raw incoming CTCP reply event. */
export interface RawCtcpReplyEventParams {
  /** Argument of the CTCP reply. */
  arg: string;
}

/** Event emitted for an incoming CTCP reply (via NOTICE). */
export type RawCtcpReplyEvent = Message<RawCtcpReplyEventParams> & {
  /**
   * Name of the CTCP command.
   *
   * @remarks `dcc` is excluded because it has no reply form
   * (only sent via PRIVMSG).
   */
  command: Exclude<AnyCtcpCommand, "dcc">;
};

export interface CtcpFeatures {
  commands: {
    /** Sends a CTCP message to a `target` with a `command` and a `param`.
     *
     * For easier use, see also other CTCP-derived methods:
     * - `action`
     * - `clientinfo`
     * - `dcc`
     * - `ping`
     * - `time`
     * - `version` */
    ctcp(target: string, command: AnyRawCtcpCommand, param?: string): void;
  };
  events:
    & { [K in `raw_ctcp:${AnyCtcpCommand}`]: RawCtcpEvent }
    & {
      [K in `raw_ctcp:${Exclude<AnyCtcpCommand, "dcc">}_reply`]:
        RawCtcpReplyEvent;
    };
  utils: {
    isCtcp: (msg: Raw) => boolean;
    createCtcp: (command: AnyRawCtcpCommand, param?: string) => string;
  };
}

const plugin: Plugin<CtcpFeatures, AnyPlugins> = createPlugin("ctcp", [])(
  (client) => {
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

        if (ctcp.command === "dcc") {
          client.emit(`raw_ctcp:${ctcp.command}`, ctcp);
        } else client.emit(`raw_ctcp:${ctcp.command}${type}`, ctcp);
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
  },
);

export default plugin;
