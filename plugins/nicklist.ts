import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import chanmodes from "./chanmodes.ts";
import chantypes from "./chantypes.ts";
import names, { type Names } from "./names.ts";
import join from "./join.ts";
import nick from "./nick.ts";
import mode from "./mode.ts";
import kick from "./kick.ts";
import kill from "./kill.ts";
import part from "./part.ts";
import quit from "./quit.ts";
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
  commands: {
    /** Gets the nicknames joined to a channel and their prefixes. */
    nicklist(channels: string | string[]): void;
  };
  events: {
    "nicklist": NicklistEvent;
  };
  state: {
    nicklists: Record<string, Nicklist>;
  };
}

export default createPlugin(
  "nicklist",
  [
    chanmodes,
    chantypes,
    join,
    nick,
    kick,
    kill,
    mode,
    names,
    part,
    quit,
    registration,
  ],
)<NicklistFeatures>((client) => {
  const namesMap: Record<string, Names> = {};
  client.state.nicklists = {};

  const createNicklist = (names: Names): Nicklist => {
    const nicks: Record<string, string[]> = {};

    // group nicks by prefix

    for (const nick in names) {
      const [prefix = ""] = (names[nick] ?? []).join("");
      nicks[prefix] ??= [];
      nicks[prefix].push(nick);
    }

    // sort grouped nicks

    const createGroup = (prefix: string): Nicklist =>
      nicks[prefix]
        .sort((a, b) => a < b ? -1 : 1)
        .map((nick) => ({ prefix, nick }));

    const groups: Nicklist[] = [];

    for (const prefix in client.state.prefixes) {
      const index = client.state.prefixes[prefix].priority;
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

  // Updates nicks.

  client.on("nick", (msg) => {
    const { source, params: { nick } } = msg;

    if (!source) return;

    for (const channel in namesMap) {
      namesMap[channel][nick] = namesMap[channel][source.name];
      delete namesMap[channel][source.name];

      const nicklist = createNicklist(namesMap[channel]);
      client.emit("nicklist", { params: { channel, nicklist } });
    }
  });

  // Updates nick prefixes.

  client.on("mode:channel", (msg) => {
    const { params: { target: channel, mode, arg } } = msg;
    if (
      arg === undefined ||
      mode.length !== 2 ||
      !client.utils.isChannel(channel)
    ) {
      return;
    }

    const [modeSet, modeLetter] = mode;

    const { prefix } = client.state.chanmodes[modeLetter];
    if (prefix === undefined) return;

    const index = client.state.prefixes[prefix].priority;

    namesMap[channel] ??= {};
    namesMap[channel][arg] ??= [];
    namesMap[channel][arg][index] = modeSet === "+" ? prefix : "";

    const nicklist = createNicklist(namesMap[channel]);

    client.state.nicklists[channel] = nicklist;
    client.emit("nicklist", { params: { channel, nicklist } });
  });

  // Removes nick from nicklist.

  const removeNick = (nick: string, channel?: string) => {
    if (channel === undefined) {
      for (const channel in namesMap) {
        removeNick(nick, channel);
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

  client.on(["part", "kick", "quit", "kill"], (msg) => {
    const { source, params } = msg;

    const nick = "nick" in params ? params.nick : source?.name;
    const channel = "channel" in params ? params.channel : undefined;

    if (nick !== undefined) {
      removeNick(nick, channel);
    }
  });

  // Alias of `client.names`

  client.nicklist = client.names;
});
