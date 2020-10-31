import * as Core from "./core/mod.ts";
import * as Action from "./plugins/action.ts";
import * as Clientinfo from "./plugins/clientinfo.ts";
import * as Ctcp from "./plugins/ctcp.ts";
import * as Debug from "./plugins/debug.ts";
import * as Error from "./plugins/error.ts";
import * as Invite from "./plugins/invite.ts";
import * as Join from "./plugins/join.ts";
import * as JoinOnInvite from "./plugins/join_on_invite.ts";
import * as JoinOnRegister from "./plugins/join_on_register.ts";
import * as Kick from "./plugins/kick.ts";
import * as Kill from "./plugins/kill.ts";
import * as Motd from "./plugins/motd.ts";
import * as Msg from "./plugins/msg.ts";
import * as Myinfo from "./plugins/myinfo.ts";
import * as MyinfoState from "./plugins/myinfo_state.ts";
import * as Nick from "./plugins/nick.ts";
import * as NickState from "./plugins/nick_state.ts";
import * as Notice from "./plugins/notice.ts";
import * as Oper from "./plugins/oper.ts";
import * as OperOnRegister from "./plugins/oper_on_register.ts";
import * as Part from "./plugins/part.ts";
import * as Ping from "./plugins/ping.ts";
import * as Quit from "./plugins/quit.ts";
import * as Register from "./plugins/register.ts";
import * as RegisterOnConnect from "./plugins/register_on_connect.ts";
import * as Time from "./plugins/time.ts";
import * as Topic from "./plugins/topic.ts";
import * as Version from "./plugins/version.ts";
import * as Whois from "./plugins/whois.ts";

export type Options =
  & Core.Options
  & Clientinfo.Options
  & Ctcp.Options
  & Debug.Options
  & JoinOnInvite.Options
  & JoinOnRegister.Options
  & OperOnRegister.Options
  & Ping.Options
  & RegisterOnConnect.Options
  & Time.Options
  & Version.Options;

export type Commands =
  & Action.Commands
  & Clientinfo.Commands
  & Ctcp.Commands
  & Invite.Commands
  & Join.Commands
  & Kick.Commands
  & Kill.Commands
  & Motd.Commands
  & Msg.Commands
  & Nick.Commands
  & Notice.Commands
  & Oper.Commands
  & Part.Commands
  & Ping.Commands
  & Quit.Commands
  & Time.Commands
  & Topic.Commands
  & Version.Commands
  & Whois.Commands;

export type Events =
  & Core.Events
  & Action.Events
  & Clientinfo.Events
  & Ctcp.Events
  & Invite.Events
  & Join.Events
  & Kick.Events
  & Kill.Events
  & Motd.Events
  & Msg.Events
  & Nick.Events
  & Notice.Events
  & Part.Events
  & Ping.Events
  & Quit.Events
  & Register.Events
  & Time.Events
  & Topic.Events
  & Version.Events
  & Whois.Events;

export type State =
  & NickState.State
  & MyinfoState.State;

const plugins = [
  Action.plugin,
  Clientinfo.plugin,
  Ctcp.plugin,
  Debug.plugin,
  Error.plugin,
  Invite.plugin,
  Join.plugin,
  JoinOnInvite.plugin,
  JoinOnRegister.plugin,
  Kick.plugin,
  Kill.plugin,
  Motd.plugin,
  Msg.plugin,
  Myinfo.plugin,
  MyinfoState.plugin,
  Nick.plugin,
  NickState.plugin,
  Notice.plugin,
  Oper.plugin,
  OperOnRegister.plugin,
  Part.plugin,
  Ping.plugin,
  Quit.plugin,
  Register.plugin,
  RegisterOnConnect.plugin,
  Time.plugin,
  Topic.plugin,
  Version.plugin,
  Whois.plugin,
];

export interface Client extends Commands {
  readonly options: Readonly<Options>;
  readonly state: Readonly<State>;
}

/** Full featured IRC client. */
export class Client extends Core.Client<Events> {
  constructor(options: Options) {
    super(options, plugins);
  }
}
