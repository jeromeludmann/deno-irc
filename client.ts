// deno-lint-ignore-file no-empty-interface
import * as Core from "./core/client.ts";
import * as Action from "./plugins/action.ts";
import * as Clientinfo from "./plugins/clientinfo.ts";
import * as Ctcp from "./plugins/ctcp.ts";
import * as ErrReply from "./plugins/err_reply.ts";
import * as InvalidNames from "./plugins/invalid_names.ts";
import * as Invite from "./plugins/invite.ts";
import * as Isupport from "./plugins/isupport.ts";
import * as Join from "./plugins/join.ts";
import * as JoinOnInvite from "./plugins/join_on_invite.ts";
import * as JoinOnRegister from "./plugins/join_on_register.ts";
import * as Kick from "./plugins/kick.ts";
import * as Kill from "./plugins/kill.ts";
import * as List from "./plugins/list.ts";
import * as Mode from "./plugins/mode.ts";
import * as Motd from "./plugins/motd.ts";
import * as Myinfo from "./plugins/myinfo.ts";
import * as Names from "./plugins/names.ts";
import * as Nick from "./plugins/nick.ts";
import * as Nicklist from "./plugins/nicklist.ts";
import * as Notice from "./plugins/notice.ts";
import * as Oper from "./plugins/oper.ts";
import * as OperOnRegister from "./plugins/oper_on_register.ts";
import * as Part from "./plugins/part.ts";
import * as Ping from "./plugins/ping.ts";
import * as Privmsg from "./plugins/privmsg.ts";
import * as Quit from "./plugins/quit.ts";
import * as Reconnect from "./plugins/reconnect.ts";
import * as Register from "./plugins/register.ts";
import * as RegisterOnConnect from "./plugins/register_on_connect.ts";
import * as ThrowOnError from "./plugins/throw_on_error.ts";
import * as Time from "./plugins/time.ts";
import * as Topic from "./plugins/topic.ts";
import * as Verbose from "./plugins/verbose.ts";
import * as Version from "./plugins/version.ts";
import * as Whois from "./plugins/whois.ts";

type ClientParams =
  & Core.CoreParams
  & Action.ActionParams
  & Clientinfo.ClientinfoParams
  & Ctcp.CtcpParams
  & ErrReply.ErrReplyParams
  & InvalidNames.InvalidNamesParams
  & Invite.InviteParams
  & Isupport.IsupportParams
  & Join.JoinParams
  & JoinOnInvite.JoinOnInviteParams
  & JoinOnRegister.JoinOnRegisterParams
  & Kick.KickParams
  & Kill.KillParams
  & List.ListParams
  & Mode.ModeParams
  & Motd.MotdParams
  & Myinfo.MyinfoParams
  & Names.NamesParams
  & Nick.NickParams
  & Nicklist.NicklistParams
  & Notice.NoticeParams
  & Oper.OperParams
  & OperOnRegister.OperOnRegisterParams
  & Part.PartParams
  & Ping.PingParams
  & Privmsg.PrivmsgParams
  & Quit.QuitParams
  & Reconnect.ReconnectParams
  & Register.RegisterParams
  & RegisterOnConnect.RegisterOnConnectParams
  & Time.TimeParams
  & Topic.TopicParams
  & Verbose.VerboseParams
  & Version.VersionParams
  & Whois.WhoisParams;

const plugins = [
  Action.actionPlugin,
  Clientinfo.clientinfoPlugin,
  Ctcp.ctcpPlugin,
  ErrReply.errReplyPlugin,
  InvalidNames.invalidNamesPlugin,
  Invite.invitePlugin,
  Isupport.isupportPlugin,
  Join.joinPlugin,
  JoinOnInvite.joinOnInvitePlugin,
  JoinOnRegister.joinOnRegisterPlugin,
  Kick.kickPlugin,
  Kill.killPlugin,
  List.listPlugin,
  Motd.motdPlugin,
  Mode.modePlugin,
  Myinfo.myinfoPlugin,
  Names.namesPlugin,
  Nick.nickPlugin,
  Nicklist.nicklistPlugin,
  Notice.noticePlugin,
  Oper.operPlugin,
  OperOnRegister.operOnRegisterPlugin,
  Part.partPlugin,
  Ping.pingPlugin,
  Privmsg.privmsgPlugin,
  Quit.quitPlugin,
  Reconnect.reconnectPlugin,
  Register.registerPlugin,
  RegisterOnConnect.registerOnConnectPlugin,
  ThrowOnError.throwOnErrorPlugin,
  Time.timePlugin,
  Topic.topicPlugin,
  Verbose.verbosePlugin,
  Version.versionPlugin,
  Whois.whoisPlugin,
];

export type Options = ClientParams["options"];
export type State = ClientParams["state"];
export type Commands = ClientParams["commands"];
export type Events = ClientParams["events"];

export interface ClientOptions extends Options {}

export interface ClientState extends State {}

export interface Client extends Commands {
  readonly state: Readonly<ClientState>;
}

export class Client extends Core.CoreClient<Events> {
  constructor(options: ClientOptions) {
    super(plugins, options);
  }
}
