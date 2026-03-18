import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters for an RPL_AWAY reply event. */
export interface AwayReplyEventParams {
  /** Nick of the client who is away. */
  nick: string;

  /** Text of away message. */
  text: string;
}

/** Event emitted when a user's away status is returned by the server. */
export type AwayReplyEvent = Message<AwayReplyEventParams>;

interface AwayFeatures {
  commands: {
    /** To be marked as being away:
     *
     * ```ts
     * client.away("I'm busy");
     * ```
     *
     * To be no longer marked as being away:
     *
     * ```ts
     * client.away();
     * ``` */
    away(text?: string): void;

    /** To be no longer marked as being away.
     *
     * Same as `client.away()` */
    back(): void;
  };

  events: {
    "away_reply": AwayReplyEvent;
  };

  state: {
    away: boolean;
  };
}

const plugin: Plugin<AwayFeatures> = createPlugin("away")((client) => {
  client.state.away = false;

  // Sends AWAY command.

  client.away = (text) => {
    client.send("AWAY", text);
  };

  client.back = () => {
    client.away();
  };

  // Emits 'away_reply' event.

  client.on("raw:rpl_away", (msg) => {
    const { source, params } = msg;
    const [, nick, text] = params;
    client.emit("away_reply", { source, params: { nick, text } });
  });

  // Sets 'away' state.

  client.on("raw:rpl_unaway", () => client.state.away = false);
  client.on("raw:rpl_nowaway", () => client.state.away = true);
});

export default plugin;
