const COMMANDS = {
  "ADMIN": "admin",
  "AUTHENTICATE": "authenticate",
  "AWAY": "away",
  "CAP": "cap",
  "CONNECT": "connect",
  "ERROR": "error",
  "INFO": "info",
  "INVITE": "invite",
  "JOIN": "join",
  "KICK": "kick",
  "KILL": "kill",
  "LINKS": "links",
  "LIST": "list",
  "MODE": "mode",
  "MOTD": "motd",
  "NICK": "nick",
  "NAMES": "names",
  "NOTICE": "notice",
  "OPER": "oper",
  "PART": "part",
  "PASS": "pass",
  "PING": "ping",
  "PONG": "pong",
  "PRIVMSG": "privmsg",
  "QUIT": "quit",
  "STATS": "stats",
  "TIME": "time",
  "TOPIC": "topic",
  "TRACE": "trace",
  "USER": "user",
  "VERSION": "version",
  "WHO": "who",
  "WHOIS": "whois",
  "WHOWAS": "whowas",
} as const;

const REPLIES = {
  "001": "rpl_welcome",
  "002": "rpl_yourhost",
  "003": "rpl_created",
  "004": "rpl_myinfo",
  "005": "rpl_isupport",
  "008": "rpl_snomask",
  "009": "rpl_statmemtot",
  "010": "rpl_bounce",
  "014": "rpl_yourcookie",
  "042": "rpl_yourid",
  "043": "rpl_savenick",
  "050": "rpl_attemptingjunc",
  "051": "rpl_attemptingreroute",
  "200": "rpl_tracelink",
  "201": "rpl_traceconnecting",
  "202": "rpl_tracehandshake",
  "203": "rpl_traceunknown",
  "204": "rpl_traceoperator",
  "205": "rpl_traceuser",
  "206": "rpl_traceserver",
  "207": "rpl_traceservice",
  "208": "rpl_tracenewtype",
  "209": "rpl_traceclass",
  "210": "rpl_stats",
  "211": "rpl_statslinkinfo",
  "212": "rpl_statscommands",
  "213": "rpl_statscline",
  "215": "rpl_statsiline",
  "216": "rpl_statskline",
  "218": "rpl_statsyline",
  "219": "rpl_endofstats",
  "221": "rpl_umodeis",
  "234": "rpl_servlist",
  "235": "rpl_servlistend",
  "236": "rpl_statsverbose",
  "237": "rpl_statsengine",
  "239": "rpl_statsiauth",
  "241": "rpl_statslline",
  "242": "rpl_statsuptime",
  "243": "rpl_statsoline",
  "244": "rpl_statshline",
  "245": "rpl_statssline",
  "250": "rpl_statsconn",
  "251": "rpl_luserclient",
  "252": "rpl_luserop",
  "253": "rpl_luserunknown",
  "254": "rpl_luserchannels",
  "255": "rpl_luserme",
  "256": "rpl_adminme",
  "257": "rpl_adminloc1",
  "258": "rpl_adminloc2",
  "259": "rpl_adminemail",
  "261": "rpl_tracelog",
  "263": "rpl_tryagain",
  "265": "rpl_localusers",
  "266": "rpl_globalusers",
  "267": "rpl_start_netstat",
  "268": "rpl_netstat",
  "269": "rpl_end_netstat",
  "270": "rpl_privs",
  "271": "rpl_silelist",
  "272": "rpl_endofsilelist",
  "273": "rpl_notify",
  "276": "rpl_vchanexist",
  "277": "rpl_vchanlist",
  "278": "rpl_vchanhelp",
  "280": "rpl_glist",
  "296": "rpl_chaninfo_kicks",
  "299": "rpl_end_chaninfo",
  "300": "rpl_none",
  "301": "rpl_away",
  "302": "rpl_userhost",
  "303": "rpl_ison",
  "305": "rpl_unaway",
  "306": "rpl_nowaway",
  "311": "rpl_whoisuser",
  "312": "rpl_whoisserver",
  "313": "rpl_whoisoperator",
  "314": "rpl_whowasuser",
  "315": "rpl_endofwho",
  "317": "rpl_whoisidle",
  "318": "rpl_endofwhois",
  "319": "rpl_whoischannels",
  "320": "rpl_whoisspecial",
  "321": "rpl_liststart",
  "322": "rpl_list",
  "323": "rpl_listend",
  "324": "rpl_channelmodeis",
  "326": "rpl_nochanpass",
  "327": "rpl_chpassunknown",
  "328": "rpl_channel_url",
  "329": "rpl_creationtime",
  "331": "rpl_notopic",
  "332": "rpl_topic",
  "333": "rpl_topicwhotime",
  "339": "rpl_badchanpass",
  "340": "rpl_userip",
  "341": "rpl_inviting",
  "345": "rpl_invited",
  "346": "rpl_invitelist",
  "347": "rpl_endofinvitelist",
  "348": "rpl_exceptlist",
  "349": "rpl_endofexceptlist",
  "351": "rpl_version",
  "352": "rpl_whoreply",
  "353": "rpl_namreply",
  "354": "rpl_whospcrpl",
  "355": "rpl_namreply",
  "364": "rpl_links",
  "365": "rpl_endoflinks",
  "366": "rpl_endofnames",
  "367": "rpl_banlist",
  "368": "rpl_endofbanlist",
  "369": "rpl_endofwhowas",
  "371": "rpl_info",
  "372": "rpl_motd",
  "374": "rpl_endofinfo",
  "375": "rpl_motdstart",
  "376": "rpl_endofmotd",
  "381": "rpl_youreoper",
  "382": "rpl_rehashing",
  "383": "rpl_youreservice",
  "385": "rpl_notoperanymore",
  "388": "rpl_alist",
  "389": "rpl_endofalist",
  "391": "rpl_time",
  "392": "rpl_usersstart",
  "393": "rpl_users",
  "394": "rpl_endofusers",
  "395": "rpl_nousers",
  "396": "rpl_hosthidden",
  "900": "rpl_loggedin",
  "901": "rpl_loggedout",
  "903": "rpl_saslsuccess",
} as const;

const ERRORS = {
  "400": "err_unknownerror",
  "401": "err_nosuchnick",
  "402": "err_nosuchserver",
  "403": "err_nosuchchannel",
  "404": "err_cannotsendtochan",
  "405": "err_toomanychannels",
  "406": "err_wasnosuchnick",
  "407": "err_toomanytargets",
  "408": "err_nosuchservice",
  "409": "err_noorigin",
  "411": "err_norecipient",
  "412": "err_notexttosend",
  "413": "err_notoplevel",
  "414": "err_wildtoplevel",
  "415": "err_badmask",
  "416": "err_toomanymatches",
  "419": "err_lengthtruncated",
  "421": "err_unknowncommand",
  "422": "err_nomotd",
  "423": "err_noadmininfo",
  "424": "err_fileerror",
  "425": "err_noopermotd",
  "429": "err_toomanyaway",
  "430": "err_eventnickchange",
  "431": "err_nonicknamegiven",
  "432": "err_erroneusnickname",
  "433": "err_nicknameinuse",
  "436": "err_nickcollision",
  "439": "err_targettoofast",
  "440": "err_servicesdown",
  "441": "err_usernotinchannel",
  "442": "err_notonchannel",
  "443": "err_useronchannel",
  "444": "err_nologin",
  "445": "err_summondisabled",
  "446": "err_usersdisabled",
  "447": "err_nonickchange",
  "449": "err_notimplemented",
  "451": "err_notregistered",
  "452": "err_idcollision",
  "453": "err_nicklost",
  "455": "err_hostilename",
  "456": "err_acceptfull",
  "457": "err_acceptexist",
  "458": "err_acceptnot",
  "459": "err_nohiding",
  "460": "err_notforhalfops",
  "461": "err_needmoreparams",
  "462": "err_alreadyregistered",
  "463": "err_nopermforhost",
  "464": "err_passwdmismatch",
  "465": "err_yourebannedcreep",
  "467": "err_keyset",
  "468": "err_invalidusername",
  "469": "err_linkset",
  "471": "err_channelisfull",
  "472": "err_unknownmode",
  "473": "err_inviteonlychan",
  "474": "err_bannedfromchan",
  "475": "err_badchannelkey",
  "476": "err_badchanmask",
  "478": "err_banlistfull",
  "479": "err_badchanname",
  "481": "err_noprivileges",
  "482": "err_chanoprivsneeded",
  "483": "err_cantkillserver",
  "485": "err_uniqoprivsneeded",
  "488": "err_tslesschan",
  "491": "err_nooperhost",
  "493": "err_nofeature",
  "494": "err_badfeature",
  "495": "err_badlogtype",
  "496": "err_badlogsys",
  "497": "err_badlogvalue",
  "498": "err_isoperlchan",
  "499": "err_chanownprivneeded",
  "501": "err_umodeunknownflag",
  "502": "err_usersdontmatch",
  "503": "err_ghostedclient",
  "504": "err_usernotonserv",
  "511": "err_silelistfull",
  "512": "err_toomanywatch",
  "513": "err_badping",
  "515": "err_badexpire",
  "516": "err_dontcheat",
  "517": "err_disabled",
  "522": "err_whosyntax",
  "523": "err_wholimexceed",
  "525": "err_remotepfx",
  "526": "err_pfxunroutable",
  "550": "err_badhostmask",
  "551": "err_hostunavail",
  "552": "err_usingsline",
  "902": "err_nicklocked",
  "904": "err_saslfail",
  "905": "err_sasltoolong",
  "906": "err_saslaborted",
  "907": "err_saslalready",
} as const;

export const PROTOCOL = {
  COMMANDS,
  REPLIES,
  ERRORS,
  ALL: { ...COMMANDS, ...REPLIES, ...ERRORS },
};

export type AnyRawCommand = keyof typeof COMMANDS;
export type AnyCommand = typeof COMMANDS[AnyRawCommand];

export type AnyRawReply = keyof typeof REPLIES;
export type AnyReply = typeof REPLIES[AnyRawReply];

export type AnyRawError = keyof typeof ERRORS;
export type AnyError = typeof ERRORS[AnyRawError];
