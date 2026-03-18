import { CoreClient, type CoreFeatures } from "./core/client.ts";
import { type CombinePluginFeatures } from "./core/plugins.ts";

import action from "./plugins/action.ts";
import antiflood from "./plugins/antiflood.ts";
import away from "./plugins/away.ts";
import cap from "./plugins/cap.ts";
import chanmodes from "./plugins/chanmodes.ts";
import chantypes from "./plugins/chantypes.ts";
import clientinfo from "./plugins/clientinfo.ts";
import ctcp from "./plugins/ctcp.ts";
import dcc from "./plugins/dcc.ts";
import errorReply from "./plugins/error_reply.ts";
import invalidNames from "./plugins/invalid_names.ts";
import invite from "./plugins/invite.ts";
import isupport from "./plugins/isupport.ts";
import join from "./plugins/join.ts";
import joinOnInvite from "./plugins/join_on_invite.ts";
import joinOnRegister from "./plugins/join_on_register.ts";
import kick from "./plugins/kick.ts";
import kill from "./plugins/kill.ts";
import list from "./plugins/list.ts";
import mode from "./plugins/mode.ts";
import modeAliases from "./plugins/mode_aliases.ts";
import motd from "./plugins/motd.ts";
import myinfo from "./plugins/myinfo.ts";
import names from "./plugins/names.ts";
import nick from "./plugins/nick.ts";
import nicklist from "./plugins/nicklist.ts";
import notice from "./plugins/notice.ts";
import oper from "./plugins/oper.ts";
import operOnRegister from "./plugins/oper_on_register.ts";
import part from "./plugins/part.ts";
import ping from "./plugins/ping.ts";
import pingTimeout from "./plugins/ping_timeout.ts";
import privmsg from "./plugins/privmsg.ts";
import quit from "./plugins/quit.ts";
import reconnect from "./plugins/reconnect.ts";
import register from "./plugins/register.ts";
import registration from "./plugins/registration.ts";
import throwOnError from "./plugins/throw_on_error.ts";
import time from "./plugins/time.ts";
import topic from "./plugins/topic.ts";
import usermodes from "./plugins/usermodes.ts";
import verbose from "./plugins/verbose.ts";
import version from "./plugins/version.ts";
import whois from "./plugins/whois.ts";

const plugins = [
  action,
  antiflood,
  away,
  cap,
  chanmodes,
  chantypes,
  clientinfo,
  ctcp,
  dcc,
  errorReply,
  invalidNames,
  invite,
  isupport,
  join,
  joinOnInvite,
  joinOnRegister,
  kick,
  kill,
  list,
  motd,
  mode,
  modeAliases,
  myinfo,
  names,
  nick,
  nicklist,
  notice,
  oper,
  operOnRegister,
  part,
  ping,
  pingTimeout,
  privmsg,
  quit,
  reconnect,
  register,
  registration,
  throwOnError,
  time,
  topic,
  usermodes,
  verbose,
  version,
  whois,
];

type ClientFeatures = CoreFeatures & CombinePluginFeatures<typeof plugins>;

/** All merged client options from core and plugins. */
export type Options = ClientFeatures["options"];
/** All merged client state from core and plugins. */
export type States = ClientFeatures["state"];
/** All merged client commands from plugins (e.g. `join`, `privmsg`). */
export type Commands = ClientFeatures["commands"];
/** All merged client events from core and plugins. */
export type Events = ClientFeatures["events"];
/** All merged client utilities from plugins. */
export type Utils = ClientFeatures["utils"];

/** Configuration options accepted by the {@link Client} constructor. */
export interface ClientOptions extends Options {}
/** Runtime state exposed via `client.state`. */
export interface ClientState extends States {}
/** Utility helpers exposed via `client.utils`. */
export interface ClientUtils extends Utils {}

/** Full-featured IRC client combining core connection handling with all built-in plugins. */
export interface Client extends Commands {
  readonly state: Readonly<ClientState>;
  readonly utils: Readonly<ClientUtils>;
}

/** Full-featured IRC client combining core connection handling with all built-in plugins. */
export class Client extends CoreClient<Events> {
  constructor(options: ClientOptions) {
    super(plugins, options);
  }
}
