import { type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import nick from "./nick.ts";
import privmsg from "./privmsg.ts";
import register from "./register.ts";

/** The authentication method to use for IRC registration. */
export type AuthMethod =
  | "NickServ"
  | "sasl"
  | "saslThenNickServ"
  | "saslExternal";

/** Represents the identity of the connected IRC user. */
export interface User {
  nick: string;
  username: string;
  realname: string;
}

export interface RegistrationFeatures {
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
     * * `NickServ` - Non-standard nickserv authentication. Requires `password`.
     * * `sasl` - SASL PLAIN auth. Requires `password`. Errors out if SASL fails.
     * * `saslThenNickServ` - Try SASL PLAIN, fallback to NickServ. Requires `password`.
     * * `saslExternal` - SASL EXTERNAL auth via TLS client certificate.
     *   Must NOT have `password`. Connection must use `{ tls: true }`.
     */
    authMethod?: AuthMethod;

    /** Timeout in seconds for SASL authentication.
     *
     * Default to `15`. `false` to disable. */
    saslTimeout?: number | false;
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

const plugin: Plugin<RegistrationFeatures, AnyPlugins> = createPlugin(
  "registration",
  [cap, nick, register, privmsg],
)((client, options) => {
  const {
    nick,
    username = nick,
    realname = nick,
    serverPassword,
    password,
  } = options;

  const authMethod = options.authMethod ?? "NickServ";
  const saslTimeout = options.saslTimeout !== false
    ? (options.saslTimeout ?? 15)
    : false;
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
      if (!payload.params[2]?.split(" ").includes("sasl")) return;
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

  const trySaslExternal = function () {
    const capListener = (payload: Raw) => {
      if (!payload.params[2]?.split(" ").includes("sasl")) return;
      client.send("AUTHENTICATE", "EXTERNAL");
      client.off("raw:cap", capListener);
    };

    client.on("raw:cap", capListener);

    client.once("raw:authenticate", (payload) => {
      if (payload.params[0] === "+") {
        client.send("AUTHENTICATE", "+");
      }
    });
  };

  let saslTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const clearSaslTimeout = () => clearTimeout(saslTimeoutId);

  const onSaslFail = (_: Raw) => {
    clearSaslTimeout();
    client.utils.completeCapNegotiation();
    if (authMethod === "saslThenNickServ") tryNickServ();
    else client.emitError("read", "ERROR: SASL auth failed", onSaslFail);
  };

  const waitForSaslSuccess = () => {
    const onSuccess = () => {
      clearSaslTimeout();
      client.utils.completeCapNegotiation();
      sendRegistration();
    };

    client.once("raw:rpl_saslsuccess", onSuccess);

    if (saslTimeout !== false) {
      saslTimeoutId = setTimeout(() => {
        client.off("raw:rpl_saslsuccess", onSuccess);
        onSaslFail({ command: "err_saslfail", params: [] } as Raw);
      }, saslTimeout * 1000);
    }
  };

  // Sends capabilities, attempts SASL connection, and registers once connected.
  client.on("connected", () => {
    if (authMethod === "saslExternal") {
      if (!client.state.remoteAddr.tls) {
        client.emitError(
          "connect",
          "SASL EXTERNAL requires a TLS connection",
          trySaslExternal,
        );
        return;
      }
      client.utils.negotiateCapabilities({ extraCaps: ["sasl"] });
      trySaslExternal();
      waitForSaslSuccess();
    } else if (!password) {
      sendRegistration();
      return client.utils.negotiateCapabilities({ completeImmediately: true });
    } else if (authMethod === "NickServ") {
      client.utils.negotiateCapabilities({ completeImmediately: true });
      sendRegistration();
      tryNickServ();
    } else {
      client.utils.negotiateCapabilities({ extraCaps: ["sasl"] });
      trySasl();
      waitForSaslSuccess();
    }
  });

  // Registers if receives ERR_NOTREGISTERED message
  client.on("raw:err_notregistered", () => sendRegistration());

  // Initializes 'nick' state.
  client.on("register", (msg) => {
    client.state.user.nick = msg.params.nick;
  });

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

export default plugin;
