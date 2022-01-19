import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface WhoisReplyEventParams {
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

export type WhoisReplyEvent = Message<WhoisReplyEventParams>;

interface WhoisFeatures {
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

export default createPlugin("whois")<WhoisFeatures>((client) => {
  const buffers: Record<string, Partial<WhoisReplyEventParams>> = {};

  // Sends WHOIS command.
  client.whois = (...params: string[]) => {
    client.send("WHOIS", ...params);
  };

  // Emits 'whois_reply' event.
  // Accumulates whois reply parts into buffer
  // and emits a `whois_reply` event once ended.
  client.on("raw", (msg) => {
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
        const { source, params: [, nick] } = msg;
        if (!(nick in buffers)) break;
        client.emit("whois_reply", {
          source,
          params: buffers[nick] as WhoisReplyEventParams,
        });
        delete buffers[nick];
        break;
      }
    }
  });
});
