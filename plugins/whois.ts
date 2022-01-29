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

  client.on("raw:rpl_whoisuser", (msg) => {
    const [, nick, username, host, , realname] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].nick = nick;
    buffers[nick].host = host;
    buffers[nick].username = username;
    buffers[nick].realname = realname;
  });

  client.on("raw:rpl_whoischannels", (msg) => {
    const [, nick, channels] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].channels = channels.split(" ");
  });

  client.on("raw:rpl_away", (msg) => {
    const [, nick, away] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].away = away;
  });

  client.on("raw:rpl_whoisidle", (msg) => {
    const [, nick, idle] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].idle = parseInt(idle, 10);
  });

  client.on("raw:rpl_whoisserver", (msg) => {
    const [, nick, server, serverInfo] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].server = server;
    buffers[nick].serverInfo = serverInfo;
  });

  client.on("raw:rpl_whoisoperator", (msg) => {
    const [, nick, text] = msg.params;
    buffers[nick] ??= {};
    buffers[nick].operator = text;
  });

  client.on("raw:rpl_endofwhois", (msg) => {
    const { source, params: [, nick] } = msg;

    if (nick in buffers) {
      client.emit("whois_reply", {
        source,
        params: buffers[nick] as WhoisReplyEventParams,
      });
      delete buffers[nick];
    }
  });
});
