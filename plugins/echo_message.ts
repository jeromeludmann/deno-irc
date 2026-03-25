import { type Message, type Raw } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import registration from "./registration.ts";

/** Parameters carried by an echo event. */
export interface EchoEventParams {
  /** Target of the echoed message. */
  target: string;

  /** Text of the echoed message. */
  text: string;
}

/** Emitted when the server echoes back a message sent by the client. */
export type EchoEvent = Message<EchoEventParams>;

interface EchoMessageFeatures {
  events: {
    "echo:privmsg": EchoEvent;
    "echo:notice": EchoEvent;
  };
  utils: {
    /** Returns true if the message was sent by the client itself (echo). */
    isEcho: (msg: Raw) => boolean;
  };
}

const echoEvents = new Set([
  "privmsg:channel",
  "privmsg:private",
  "notice:channel",
  "notice:private",
]);

const plugin: Plugin<EchoMessageFeatures, AnyPlugins> = createPlugin(
  "echo_message",
  [cap, registration],
)((client) => {
  client.state.capabilities.push("echo-message");

  client.utils.isEcho = (msg) => msg.source?.name === client.state.user.nick;

  // Intercept emit to suppress normal privmsg/notice for self-messages
  // and emit echo:privmsg / echo:notice instead.

  client.hooks.hookCall("emit", (emit, event, ...args) => {
    if (echoEvents.has(event)) {
      const payload = args[0] as {
        source?: { name: string };
        params: EchoEventParams;
      };
      if (payload?.source?.name === client.state.user.nick) {
        const echoEvent = event.startsWith("privmsg")
          ? "echo:privmsg"
          : "echo:notice";
        return emit(echoEvent, payload);
      }
    }
    return emit(event, ...args);
  });
});

export default plugin;
