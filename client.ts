import type { Params as CoreParams } from "./core/client.ts";
import { Client as CoreClient } from "./core/client.ts";
import type { ActionParams } from "./plugins/action.ts";
import { action } from "./plugins/action.ts";
import type { ClientinfoParams } from "./plugins/clientinfo.ts";
import { clientinfo } from "./plugins/clientinfo.ts";
import type { CtcpParams } from "./plugins/ctcp.ts";
import { ctcp } from "./plugins/ctcp.ts";
import type { DebugParams } from "./plugins/debug.ts";
import { debug } from "./plugins/debug.ts";
import type { InviteParams } from "./plugins/invite.ts";
import { invite } from "./plugins/invite.ts";
import type { JoinParams } from "./plugins/join.ts";
import { join } from "./plugins/join.ts";
import type { JoinOnInviteParams } from "./plugins/join_on_invite.ts";
import { joinOnInvite } from "./plugins/join_on_invite.ts";
import type { JoinOnRegisterParams } from "./plugins/join_on_register.ts";
import { joinOnRegister } from "./plugins/join_on_register.ts";
import type { KickParams } from "./plugins/kick.ts";
import { kick } from "./plugins/kick.ts";
import type { KillParams } from "./plugins/kill.ts";
import { kill } from "./plugins/kill.ts";
import type { MotdParams } from "./plugins/motd.ts";
import { motd } from "./plugins/motd.ts";
import type { MsgParams } from "./plugins/msg.ts";
import { msg } from "./plugins/msg.ts";
import type { MyinfoParams } from "./plugins/myinfo.ts";
import { myinfo } from "./plugins/myinfo.ts";
import type { MyinfoStateParams } from "./plugins/myinfo_state.ts";
import { myinfoState } from "./plugins/myinfo_state.ts";
import type { NickParams } from "./plugins/nick.ts";
import { nick } from "./plugins/nick.ts";
import type { NickStateParams } from "./plugins/nick_state.ts";
import { nickState } from "./plugins/nick_state.ts";
import type { NoticeParams } from "./plugins/notice.ts";
import { notice } from "./plugins/notice.ts";
import type { OperParams } from "./plugins/oper.ts";
import { oper } from "./plugins/oper.ts";
import type { OperOnRegisterParams } from "./plugins/oper_on_register.ts";
import { operOnRegister } from "./plugins/oper_on_register.ts";
import type { PartParams } from "./plugins/part.ts";
import { part } from "./plugins/part.ts";
import type { PingParams } from "./plugins/ping.ts";
import { ping } from "./plugins/ping.ts";
import type { QuitParams } from "./plugins/quit.ts";
import { quit } from "./plugins/quit.ts";
import type { RegisterParams } from "./plugins/register.ts";
import { register } from "./plugins/register.ts";
import type { RegisterOnConnectParams } from "./plugins/register_on_connect.ts";
import { registerOnConnect } from "./plugins/register_on_connect.ts";
import type { ServerErrorParams } from "./plugins/server_error.ts";
import { serverError } from "./plugins/server_error.ts";
import type { TimeParams } from "./plugins/time.ts";
import { time } from "./plugins/time.ts";
import type { TopicParams } from "./plugins/topic.ts";
import { topic } from "./plugins/topic.ts";
import type { VersionParams } from "./plugins/version.ts";
import { version } from "./plugins/version.ts";
import type { WhoisParams } from "./plugins/whois.ts";
import { whois } from "./plugins/whois.ts";

type Params =
  & CoreParams
  & ActionParams
  & ClientinfoParams
  & CtcpParams
  & DebugParams
  & InviteParams
  & JoinParams
  & JoinOnInviteParams
  & JoinOnRegisterParams
  & KickParams
  & KillParams
  & MotdParams
  & MsgParams
  & MyinfoParams
  & MyinfoStateParams
  & NickParams
  & NickStateParams
  & NoticeParams
  & OperParams
  & OperOnRegisterParams
  & PartParams
  & PingParams
  & QuitParams
  & RegisterParams
  & RegisterOnConnectParams
  & ServerErrorParams
  & TimeParams
  & TopicParams
  & VersionParams
  & WhoisParams;

const plugins = [
  action,
  clientinfo,
  ctcp,
  debug,
  invite,
  join,
  joinOnInvite,
  joinOnRegister,
  kick,
  kill,
  motd,
  msg,
  myinfo,
  myinfoState,
  nick,
  nickState,
  notice,
  oper,
  operOnRegister,
  part,
  ping,
  quit,
  register,
  registerOnConnect,
  serverError,
  time,
  topic,
  version,
  whois,
];

export type Options = Params["options"];
export type Commands = Params["commands"];
export type Events = Params["events"];
export type State = Params["state"];

export interface Client extends Commands {
  readonly options: Readonly<Options>;
  readonly state: Readonly<State>;
}

/** Full featured IRC client. */
export class Client extends CoreClient<Events> {
  constructor(options: Options) {
    super(options, plugins);
  }
}
