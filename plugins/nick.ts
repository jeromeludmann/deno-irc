import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Options {
  /** The nick used to register the client to the server. */
  nick: string;
}

export interface Commands {
  /** Sets the `nick` of the client (once connected). */
  nick(nick: string): void;
}

export interface Events {
  "nick": Nick;
}

export interface Nick {
  /** User who sent the NICK. */
  origin: UserMask;
  /** New nick used by the user. */
  nick: string;
}

export interface State {
  nick: string;
}

export interface NickPluginParams {
  commands: Commands;
  events: Events;
  options: Options;
  state: State;
}

function commands(client: ExtendedClient<NickPluginParams>) {
  client.nick = client.send.bind(client, "NICK");
}

function events(client: ExtendedClient<NickPluginParams>) {
  client.on("raw", (msg) => {
    if (msg.command !== "NICK") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [nick] = msg.params;

    client.emit("nick", { origin, nick });
  });
}

function state(client: ExtendedClient<NickPluginParams>) {
  client.state.nick = client.options.nick;

  client.on("nick", (msg) => {
    if (msg.origin.nick === client.state.nick) {
      client.state.nick = msg.nick;
    }
  });
}

export const plugin = createPlugin(commands, events, state);
