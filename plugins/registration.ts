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

  const sendRegistration = (sendPass = true) => {
    if (password !== undefined && sendPass) {
      client.pass(password);
    }
    client.nick(nick);
    client.user(username, realname);
  };

  function* chunks<T>(str: string, n: number): Generator<string, void> {
    for (let i = 0; i < str.length; i += n) {
      yield str.slice(i, i + n);
    }
  }

  // Resolves or rejects to denote if authenticating via sasl worked.
  const trySasl = () => {
    sendRegistration(false);

    const capListener = (payload: Raw) => {
      if (payload.params[2] !== "sasl") return;
      client.send("AUTHENTICATE", "PLAIN");
      client.off("raw:cap", capListener);
    };

    client.on("raw:cap", capListener);

    client.once("raw:authenticate", (payload) => {
      if (payload.params[0] === "+") {
        const chunked = [...chunks(btoa(`\x00${username}\x00${password}`), 400)];
        for (let i = 0; i < chunked.length; i++) {
          const chunk = chunked[i];
          client.send("AUTHENTICATE", chunk);
          if (i === chunked.length - 1 && chunk.length === 400) {
            client.send("AUTHENTICATE", "+");
          }
        }
      }
    });
  }

  // Sends capabilities, attempts SASL connection, and registers once connected.
  client.on("connected", () => {
    client.utils.sendCapabilities();
    if (options.useSasl && !!password) {
      client.cap("REQ", "sasl");
      trySasl();
      client.once("raw:rpl_saslsuccess", () => client.cap("END"));
      client.once("raw:err_saslfail", () => sendRegistration());
      client.once("raw:err_saslaborted", () => sendRegistration());
    } else {
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
