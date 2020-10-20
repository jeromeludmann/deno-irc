import type { ExtendedClient, Raw, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Options {
  /** Automatic CTCP replies. */
  replies?: {};
}

export interface Commands {
  /** Sends a CTCP message to a `target` with a `command` and a `param`. */
  ctcp(target: string, command: AnyCtcpCommand, param?: string): void;
}

export interface Events {
  "raw:ctcp": RawCtcp;
}

export type AnyCtcpCommand =
  | "ACTION"
  | "CLIENTINFO"
  | "PING"
  | "TIME"
  | "VERSION";

export interface RawCtcp {
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

export interface CtcpPluginParams {
  commands: Commands;
  events: Events;
}

export function isCtcp(msg: Raw): boolean {
  return (
    msg.params.length === 2 &&
    msg.params[1][0] === "\u0001" &&
    msg.params[1][msg.params[1].length - 1] === "\u0001" &&
    (msg.command === "PRIVMSG" || msg.command === "NOTICE")
  );
}

export function createCtcp(command: string, param?: string) {
  let ctcp = `\u0001${command}`;
  if (param) ctcp += ` ${param}`;
  ctcp += "\u0001";
  return ctcp;
}

export function commands(client: ExtendedClient<CtcpPluginParams>) {
  client.ctcp = (target, command, param) => {
    client.send("PRIVMSG", target, createCtcp(command, param));
  };
}

export function events(client: ExtendedClient<CtcpPluginParams>) {
  client.on("raw", (msg) => {
    if (!isCtcp(msg)) {
      return;
    }

    const { command, params } = msg;
    const [target, rawCtcp] = params;

    const i = rawCtcp.indexOf(" ", 1);
    const ctcpCommand = rawCtcp.slice(1, i) as AnyCtcpCommand;
    const ctcpParam = i === -1 ? undefined : rawCtcp.slice(i + 1, -1);

    const ctcp: RawCtcp = {
      origin: parseUserMask(msg.prefix),
      target,
      command: ctcpCommand,
      type: command === "PRIVMSG" ? "query" : "reply",
    };

    if (ctcpParam) {
      ctcp.param = ctcpParam;
    }

    client.emit("raw:ctcp", ctcp);
  });
}

export const plugin = createPlugin(commands, events);
