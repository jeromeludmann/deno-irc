import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export interface WhoisReplyEvent {
  /** Nick. */
  nick: string;

  /** Hostname. */
  host: string;

  /** User name. */
  username: string;

  /** Real name. */
  realname: string;

  /** Channels joined. */
  channels: string[];

  /** Idle time. */
  idle: number;

  /** Server where the user is connected. */
  server: string;

  /** Informations of the connected server. */
  serverInfo: string;

  /** Optional user operator message. */
  operator?: string;

  /** Optional away message. */
  away?: string;
}

export interface WhoisParams {
  commands: {
    /** Gets the WHOIS informations of a `nick`. */
    whois(nick: string): void;

    /** Gets the WHOIS informations of a `nick` for a given `server`. */
    whois(server: string, nick: string): void;
  };
  events: {
    "whois_reply": WhoisReplyEvent;
  };
}

export const whoisPlugin: Plugin<WhoisParams> = (client) => {
  const buffers: Record<string, Partial<WhoisReplyEvent>> = {};

  const sendWhois = (...params: string[]) => {
    client.send("WHOIS", ...params);
  };

  const emitWhois = (msg: Raw) => {
    switch (msg.command) {
      case "RPL_WHOISUSER": {
        const [, nick, username, host, , realname] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].nick = nick;
        buffers[nick].host = host;
        buffers[nick].username = username;
        buffers[nick].realname = realname;
        break;
      }
      case "RPL_WHOISCHANNELS": {
        const [, nick, channels] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].channels = channels.split(" ");
        break;
      }
      case "RPL_AWAY": {
        const [, nick, away] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].away = away;
        break;
      }
      case "RPL_WHOISIDLE": {
        const [, nick, idle] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].idle = parseInt(idle, 10);
        break;
      }
      case "RPL_WHOISSERVER": {
        const [, nick, server, serverInfo] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].server = server;
        buffers[nick].serverInfo = serverInfo;
        break;
      }
      case "RPL_WHOISOPERATOR": {
        const [, nick, text] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].operator = text;
        break;
      }
      case "RPL_ENDOFWHOIS": {
        const [, nick] = msg.params;
        if (!(nick in buffers)) break;
        client.emit("whois_reply", buffers[nick] as WhoisReplyEvent);
        delete buffers[nick];
        break;
      }
    }
  };

  client.whois = sendWhois;
  client.on("raw", emitWhois);
};
