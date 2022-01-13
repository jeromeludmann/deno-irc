import { type Plugin } from "../core/client.ts";
import { type IsupportParams } from "./isupport.ts";
import { type JoinEvent, type JoinParams } from "./join.ts";
import { type KickEvent, type KickParams } from "./kick.ts";
import { type KillEvent, type KillParams } from "./kill.ts";
import { type ChannelModeEvent, type ModeParams } from "./mode.ts";
import { type Names, type NamesParams, type NamesReplyEvent } from "./names.ts";
import { type PartEvent, type PartParams } from "./part.ts";
import { type QuitEvent, type QuitParams } from "./quit.ts";
import { type RegisterOnConnectParams } from "./register_on_connect.ts";

export type Nicklist = { prefix: string; nick: string }[];

export interface NicklistEvent {
  /** Name of the channel. */
  channel: string;

  /** Nicknames joined to this channel. */
  nicklist: Nicklist;
}

export interface NicklistParams {
  events: {
    "nicklist": NicklistEvent;
  };
  state: {
    nicklists: Record<string, Nicklist>;
  };
}

export const nicklistPlugin: Plugin<
  & IsupportParams
  & NamesParams
  & JoinParams
  & PartParams
  & KickParams
  & KillParams
  & QuitParams
  & ModeParams
  & RegisterOnConnectParams
  & NicklistParams
> = (client) => {
  const createNicklist = (names: Names): Nicklist => {
    const { supported } = client.state;
    const nicks: Record<string, string[]> = {};

    const createGroup = (prefix: string): Nicklist =>
      nicks[prefix]
        .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
        .map((nick) => ({ prefix, nick }));

    // group nicks by prefix
    for (const nick in names) {
      const [prefix = ""] = names[nick].join("");
      nicks[prefix] ??= [];
      nicks[prefix].push(nick);
    }

    // sort grouped nicks
    const groups: Nicklist[] = [];
    for (const prefix in supported.prefixes) {
      const index = supported.prefixes[prefix].priority;
      if (!(prefix in nicks)) continue;
      groups[index] = createGroup(prefix);
    }
    if ("" in nicks) {
      groups.push(createGroup(""));
    }

    return groups.flat();
  };

  const addNick = (msg: JoinEvent) => {
    const { origin: { nick }, channel } = msg;

    if (nick === client.state.nick) {
      namesMap[channel] ??= {};
    }

    namesMap[channel][nick] = [];

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { channel, nicklist });
  };

  const setNicks = (msg: NamesReplyEvent) => {
    const { channel, names } = msg;

    namesMap[channel] = names;

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { channel, nicklist });
  };

  const updatePrefix = (msg: ChannelModeEvent) => {
    const { channel, mode, arg } = msg;

    if (arg === undefined || mode.length !== 2) {
      return;
    }

    const { prefix } = client.state.supported.modes.channel[mode.charAt(1)];
    if (prefix === undefined) {
      return;
    }

    const index = client.state.supported.prefixes[prefix].priority;
    namesMap[channel][arg][index] = mode.charAt(0) === "+" ? prefix : "";

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { channel, nicklist });
  };

  const removeNick = (msg: PartEvent | QuitEvent | KickEvent | KillEvent) => {
    const remove = (nick: string, channel?: string) => {
      if (channel === undefined) {
        for (const channel in namesMap) {
          remove(nick, channel);
        }
        return;
      }

      let nicklist: Nicklist;

      if (nick === client.state.nick) {
        delete namesMap[channel];
        delete client.state.nicklists[channel];
        nicklist = [];
      } else {
        delete namesMap[channel][nick];
        nicklist = createNicklist(namesMap[channel]);
        client.state.nicklists[channel] = nicklist;
      }

      client.emit("nicklist", { channel, nicklist });
    };

    const nick = "nick" in msg ? msg.nick : msg.origin.nick;
    const channel = "channel" in msg ? msg.channel : undefined;

    remove(nick, channel);
  };

  const namesMap: Record<string, Names> = {};
  client.state.nicklists = {};

  client.on("join", addNick);
  client.on("names_reply", setNicks);
  client.on("mode:channel", updatePrefix);
  client.on("part", removeNick);
  client.on("kick", removeNick);
  client.on("quit", removeNick);
  client.on("kill", removeNick);
};
