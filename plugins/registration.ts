import { Raw } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import nick from "./nick.ts";
import privmsg from "./privmsg.ts";
import register from "./register.ts";

export interface User {
  nick: string;
  username: string;
  realname: string;
}

interface RegistrationFeatures {
  options: {
    /** The nick used to register the client to the server. */
    nick: string;

    /** The username used to register the client to the server. */
    username?: string;

    /** The password for the user account associated with the username field. */
    password?: string;

    /** The realname used to register the client to the server. */
    realname?: string;

    /** Optional server password. */
    serverPassword?: string;

    /** The authentication method to use. Defaults to NickServ if omitted.
     * * `NickServ` - Non-standard nickserv authentication.
     * * `sasl` - SASL PLAIN auth. Errors out if SASL fails.
     * * `saslThenNickServ` - Try SASL PLAIN, but fallback to NickServ if it fails.
     */
    authMethod?: "NickServ" | "sasl" | "saslThenNickServ";
  };
  state: {
    user: User;
  };
}

function chunks(str: string, n: number): string[] {
  const result = [];
  for (let i = 0; i < str.length; i += n) {
    result.push(str.slice(i, i + n));
  }

  return result;
}

export default createPlugin(
  "registration",
  [cap, nick, register, privmsg],
)<RegistrationFeatures>((client, options) => {
  const {
    nick,
    username = nick,
    realname = nick,
    serverPassword,
    password,
  } = options;

  const authMethod = options.authMethod ?? "NickServ";
  client.state.user = { nick, username, realname };

  const sendRegistration = () => {
    if (serverPassword) client.pass(serverPassword);
    client.nick(nick);
    client.user(username, realname);
  };

  const tryNickServ = () => {
    client.privmsg("NickServ", `identify ${username} ${password}`);
  };

  const trySasl = function () {
    const capListener = (payload: Raw) => {
      if (payload.params[2] !== "sasl") return;
      client.send("AUTHENTICATE", "PLAIN");
      client.off("raw:cap", capListener);
    };

    client.on("raw:cap", capListener);

    client.once("raw:authenticate", (payload) => {
      if (payload.params[0] === "+") {
        const chunked = chunks(btoa(`\x00${username}\x00${password}`), 400);
        for (let i = 0; i < chunked.length; i++) {
          const chunk = chunked[i];
          client.send("AUTHENTICATE", chunk);
          if (i === chunked.length - 1 && chunk.length === 400) {
            client.send("AUTHENTICATE", "+");
          }
        }
      }
    });
  };

  // Sends capabilities, attempts SASL connection, and registers once connected.
  client.on("connected", () => {
    if (!password) {
      sendRegistration();
      return client.utils.negotiateCapabilities({ completeImmediately: true });
    } else if (authMethod === "NickServ") {
      client.utils.negotiateCapabilities({ completeImmediately: true });
      sendRegistration();
      tryNickServ();
    } else {
      client.utils.negotiateCapabilities({ extraCaps: ["sasl"] });
      trySasl();
      client.once(
        "raw:rpl_saslsuccess",
        () => {
          client.utils.completeCapNegotiation();
          sendRegistration();
        },
      );
    }
  });

  // Registers if receives ERR_NOTREGISTERED message
  client.on("raw:err_notregistered", () => sendRegistration());

  // Initializes 'nick' state.
  client.on("register", (msg) => {
    client.state.user.nick = msg.params.nick;
  });

  const onSaslFail = (_: Raw) => {
    client.utils.completeCapNegotiation();
    if (authMethod === "saslThenNickServ") tryNickServ();
    else client.emitError("read", "ERROR: SASL auth failed", onSaslFail);
  };

  client.on(["raw:err_saslfail", "raw:err_saslaborted"], onSaslFail);

  // Updates 'nick' state.
  client.on("nick", (msg) => {
    const { source, params } = msg;
    const { user } = client.state;

    if (source?.name === user.nick) {
      user.nick = params.nick;
    }
  });
});
