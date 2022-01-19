import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { isChannel } from "../core/strings.ts";
import isupport from "./isupport.ts";
import names, { type Names } from "./names.ts";
import join from "./join.ts";
import mode from "./mode.ts";
import kick, { type KickEvent } from "./kick.ts";
import kill, { type KillEvent } from "./kill.ts";
import part, { type PartEvent } from "./part.ts";
import quit, { type QuitEvent } from "./quit.ts";
import registration from "./registration.ts";

export type Nicklist = { prefix: string; nick: string }[];

export interface NicklistEventParams {
  /** Name of the channel. */
  channel: string;

  /** Nicknames joined to this channel. */
  nicklist: Nicklist;
}

export type NicklistEvent = Message<NicklistEventParams>;

interface NicklistFeatures {
  events: {
    "nicklist": NicklistEvent;
  };
  state: {
    nicklists: Record<string, Nicklist>;
  };
}

export default createPlugin(
  "nicklist",
  [isupport, join, kick, kill, mode, names, part, quit, registration],
)<NicklistFeatures>((client) => {
  const namesMap: Record<string, Names> = {};
  client.state.nicklists = {};

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

  // Initializes nicklist.
  client.on("names_reply", (msg) => {
    const { params: { channel, names } } = msg;

    namesMap[channel] = names;

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { params: { channel, nicklist } });
  });

  // Adds nick to nicklist.
  client.on("join", (msg) => {
    const { source, params: { channel } } = msg;

    if (!source) return;

    namesMap[channel] ??= {};
    namesMap[channel][source.name] = [];

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { params: { channel, nicklist } });
  });

  // Updates nick prefixes.
  client.on("mode:channel", (msg) => {
    const { params: { target: channel, mode, arg } } = msg;

    if (
      arg === undefined ||
      mode.length !== 2 ||
      !isChannel(channel)
    ) {
      return;
    }

    const { prefix } = client.state.supported.modes.channel[mode.charAt(1)];
    if (prefix === undefined) {
      return;
    }

    const index = client.state.supported.prefixes[prefix].priority;

    namesMap[channel] ??= {};
    namesMap[channel][arg] ??= [];
    namesMap[channel][arg][index] = mode.charAt(0) === "+" ? prefix : "";

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { params: { channel, nicklist } });
  });

  // Removes nick from nicklist.
  const removeNick = (msg: PartEvent | QuitEvent | KickEvent | KillEvent) => {
    const remove = (nick: string, channel?: string) => {
      if (channel === undefined) {
        for (const channel in namesMap) {
          remove(nick, channel);
        }
        return;
      }

      let nicklist: Nicklist;

      if (nick === client.state.user.nick) {
        delete namesMap[channel];
        delete client.state.nicklists[channel];
        nicklist = [];
      } else {
        if (channel in namesMap) {
          delete namesMap[channel][nick];
        }
        nicklist = createNicklist(namesMap[channel]);
        client.state.nicklists[channel] = nicklist;
      }

      client.emit("nicklist", { params: { channel, nicklist } });
    };

    const { source, params } = msg;

    const nick = "nick" in params ? params.nick : source?.name;
    const channel = "channel" in params ? params.channel : undefined;

    if (nick !== undefined) {
      remove(nick, channel);
    }
  };
  client.on("part", removeNick);
  client.on("kick", removeNick);
  client.on("quit", removeNick);
  client.on("kill", removeNick);
});
