import { Raw } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import nick from "./nick.ts";
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

    /** The realname used to register the client to the server. */
    realname?: string;

    /** The password used to connect the client to the server. */
    password?: string;

    /** Whether we should use SASL to authenticate or not. */
    useSasl?: boolean;

    /** SASL authentication mechanism to use. If unspecified, defaults to "PLAIN". 
     * Currently, only PLAIN is supported.
    */
    saslType?: "PLAIN";
  };
  state: {
    user: User;
  };
}

export default createPlugin(
  "registration",
  [cap, nick, register],
)<RegistrationFeatures>((client, options) => {
  const { nick, username = nick, realname = nick, password } = options;
  client.state.user = { nick, username, realname };

  const sendRegistration = () => {
    if (password !== undefined) {
      client.pass(password);
    }
    client.nick(nick);
    client.user(username, realname);
  };

  // Resolves or rejects to denote if authenticating via sasl worked.
  const trySasl = () => {
    return new Promise((resolve: (_: void) => void, reject: (_: void) => void) => {
      if (password === undefined) {
        reject();
      }
      client.nick(nick);
      client.user(username, realname);
      const capListener = (payload: Raw) => {
        if (payload.params[2] === 'sasl') {
          client.send("AUTHENTICATE", options.saslType || "PLAIN");
          client.off("raw:cap", capListener);
        }
      }

      client.on("raw:cap", capListener);

      client.once("raw:authenticate", (payload) => {
        if (payload.params[0] === "+") {
          client.send("AUTHENTICATE", btoa(`${username}\x00${username}\x00${password}`));
          client.once("raw:rpl_saslsuccess", () => {
            resolve();
          })
        }
      })
    })
  }

  // Sends capabilities, attempts SASL connection, and registers once connected.
  client.on("connected", () => {
    if (options.useSasl) {
      client.cap("REQ", "sasl");
      trySasl().then(_ => {
        client.cap("END");
        client.utils.sendCapabilities();
      }).catch(_ => {
        client.utils.sendCapabilities();
        sendRegistration();
      })
    }
    else {
      client.utils.sendCapabilities();
      sendRegistration();
    }
  });

  // Registers if receives ERR_NOTREGISTERED message

  client.on("raw:err_notregistered", () => {
    sendRegistration();
  });

  // Initializes 'nick' state.

  client.on("register", (msg) => {
    client.state.user.nick = msg.params.nick;
  });

  // Updates 'nick' state.

  client.on("nick", (msg) => {
    const { source, params } = msg;
    const { user } = client.state;

    if (source?.name === user.nick) {
      user.nick = params.nick;
    }
  });
});
