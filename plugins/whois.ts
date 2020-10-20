import type { ExtendedClient } from "../core/mod.ts";
import { createPlugin } from "../core/mod.ts";

export interface Commands {
  /** Gets the WHOIS informations of a `nick`. */
  whois(nick: string): void;
  /** Gets the WHOIS informations of a `nick` for a given `server`. */
  whois(server: string, nick: string): void;
}

export interface Events {
  "whois_reply": WhoisReply;
}

export interface WhoisReply {
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

export interface WhoisPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<WhoisPluginParams>) {
  client.whois = client.send.bind(client, "WHOIS");
}

function events(client: ExtendedClient<WhoisPluginParams>) {
  const buffers: Record<string, Partial<WhoisReply>> = {};

  client.on("raw", (msg) => {
    switch (msg.command) {
      case "RPL_WHOISUSER": {
        const [, nick, username, host, , realname] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].nick = nick;
        buffers[nick].host = host;
        buffers[nick].username = username;
        buffers[nick].realname = realname;
        return;
      }

      case "RPL_WHOISCHANNELS": {
        const [, nick, channels] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].channels = channels.split(" ");
        return;
      }

      case "RPL_AWAY": {
        const [, nick, away] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].away = away;
        return;
      }

      case "RPL_WHOISIDLE": {
        const [, nick, idle] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].idle = parseInt(idle, 10);
        return;
      }

      case "RPL_WHOISSERVER": {
        const [, nick, server, serverInfo] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].server = server;
        buffers[nick].serverInfo = serverInfo;
        return;
      }

      case "RPL_WHOISOPERATOR": {
        const [, nick, text] = msg.params;
        buffers[nick] ??= {};
        buffers[nick].operator = text;
        return;
      }

      case "RPL_ENDOFWHOIS": {
        const [, nick] = msg.params;

        if (!(nick in buffers)) {
          return;
        }

        client.emit("whois_reply", buffers[nick] as WhoisReply);
        delete buffers[nick];
        return;
      }
    }
  });
}

export const plugin = createPlugin(commands, events);
