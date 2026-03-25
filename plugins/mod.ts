export { default as action } from "./action.ts";
export { default as antiflood } from "./antiflood.ts";
export { default as away } from "./away.ts";
export { default as cap } from "./cap.ts";
export { default as chanmodes } from "./chanmodes.ts";
export { default as chantypes } from "./chantypes.ts";
export { default as clientinfo } from "./clientinfo.ts";
export { default as ctcp } from "./ctcp.ts";
export { default as dcc } from "./dcc.ts";
export { default as errorReply } from "./error_reply.ts";
export { default as invalidNames } from "./invalid_names.ts";
export { default as invite } from "./invite.ts";
export { default as isupport } from "./isupport.ts";
export { default as join } from "./join.ts";
export { default as joinOnInvite } from "./join_on_invite.ts";
export { default as joinOnRegister } from "./join_on_register.ts";
export { default as kick } from "./kick.ts";
export { default as kill } from "./kill.ts";
export { default as list } from "./list.ts";
export { default as mode } from "./mode.ts";
export { default as modeAliases } from "./mode_aliases.ts";
export { default as motd } from "./motd.ts";
export { default as myinfo } from "./myinfo.ts";
export { default as names } from "./names.ts";
export { default as nick } from "./nick.ts";
export { default as nicklist } from "./nicklist.ts";
export { default as notice } from "./notice.ts";
export { default as oper } from "./oper.ts";
export { default as operOnRegister } from "./oper_on_register.ts";
export { default as part } from "./part.ts";
export { default as ping } from "./ping.ts";
export { default as pingTimeout } from "./ping_timeout.ts";
export { default as privmsg } from "./privmsg.ts";
export { default as quit } from "./quit.ts";
export { default as reconnect } from "./reconnect.ts";
export { default as register } from "./register.ts";
export { default as registration } from "./registration.ts";
export { default as throwOnError } from "./throw_on_error.ts";
export { default as time } from "./time.ts";
export { default as topic } from "./topic.ts";
export { default as usermodes } from "./usermodes.ts";
export { default as verbose } from "./verbose.ts";
export { default as version } from "./version.ts";
export { default as accountNotify } from "./account_notify.ts";
export { default as accountTag } from "./account_tag.ts";
export { default as awayNotify } from "./away_notify.ts";
export { default as chghost } from "./chghost.ts";
export { default as echoMessage } from "./echo_message.ts";
export { default as extendedJoin } from "./extended_join.ts";
export { default as inviteNotify } from "./invite_notify.ts";
export { default as messageTags } from "./message_tags.ts";
export { default as serverTime } from "./server_time.ts";
export { default as setname } from "./setname.ts";
export { default as who } from "./who.ts";
export { default as monitor } from "./monitor.ts";
export { default as whois } from "./whois.ts";

import action from "./action.ts";
import antiflood from "./antiflood.ts";
import away from "./away.ts";
import cap from "./cap.ts";
import chanmodes from "./chanmodes.ts";
import chantypes from "./chantypes.ts";
import clientinfo from "./clientinfo.ts";
import ctcp from "./ctcp.ts";
import dcc from "./dcc.ts";
import errorReply from "./error_reply.ts";
import invalidNames from "./invalid_names.ts";
import invite from "./invite.ts";
import isupport from "./isupport.ts";
import join from "./join.ts";
import joinOnInvite from "./join_on_invite.ts";
import joinOnRegister from "./join_on_register.ts";
import kick from "./kick.ts";
import kill from "./kill.ts";
import list from "./list.ts";
import mode from "./mode.ts";
import modeAliases from "./mode_aliases.ts";
import motd from "./motd.ts";
import myinfo from "./myinfo.ts";
import names from "./names.ts";
import nick from "./nick.ts";
import nicklist from "./nicklist.ts";
import notice from "./notice.ts";
import oper from "./oper.ts";
import operOnRegister from "./oper_on_register.ts";
import part from "./part.ts";
import ping from "./ping.ts";
import pingTimeout from "./ping_timeout.ts";
import privmsg from "./privmsg.ts";
import quit from "./quit.ts";
import reconnect from "./reconnect.ts";
import register from "./register.ts";
import registration from "./registration.ts";
import throwOnError from "./throw_on_error.ts";
import time from "./time.ts";
import topic from "./topic.ts";
import usermodes from "./usermodes.ts";
import verbose from "./verbose.ts";
import version from "./version.ts";
import accountNotify from "./account_notify.ts";
import accountTag from "./account_tag.ts";
import awayNotify from "./away_notify.ts";
import chghost from "./chghost.ts";
import echoMessage from "./echo_message.ts";
import extendedJoin from "./extended_join.ts";
import inviteNotify from "./invite_notify.ts";
import messageTags from "./message_tags.ts";
import serverTime from "./server_time.ts";
import setname from "./setname.ts";
import who from "./who.ts";
import monitor from "./monitor.ts";
import whois from "./whois.ts";

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
  accountNotify,
  accountTag,
  awayNotify,
  chghost,
  echoMessage,
  extendedJoin,
  inviteNotify,
  messageTags,
  serverTime,
  setname,
  who,
  monitor,
  whois,
];

export default plugins;
