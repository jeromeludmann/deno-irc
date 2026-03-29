import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import ctcp from "./ctcp.ts";
import chantypes from "./chantypes.ts";

/** Parameters carried by a NOTICE event. */
export interface NoticeEventParams {
  /** Target of the NOTICE.
   *
   * Can be either a channel or a nick. */
  target: string;

  /** Text of the NOTICE. */
  text: string;
}

/** Emitted when a NOTICE is received (channel or private). */
export type NoticeEvent = Message<NoticeEventParams>;

export interface NoticeFeatures {
  commands: {
    /** Notifies a `target` with a `text`. */
    notice(target: string, text: string): void;
  };
  events: {
    "notice": NoticeEvent;
    "notice:channel": NoticeEvent;
    "notice:private": NoticeEvent;
  };
}

const plugin: Plugin<NoticeFeatures, AnyPlugins> = createPlugin(
  "notice",
  [ctcp, chantypes],
)((client) => {
  // Sends NOTICE command.

  client.notice = (target, text) => {
    client.send("NOTICE", target, text);
  };

  // Emits "notice:*" events.

  client.on("raw:notice", (msg) => {
    if (client.utils.isCtcp(msg)) return;

    const { source, params: [target, text] } = msg;

    const targetType = client.utils.isChannel(target) ? "channel" : "private";
    const event = `notice:${targetType}` as const;

    client.emit(event, { source, params: { target, text } });
  });

  client.createMultiEvent(
    "notice",
    ["notice:channel", "notice:private"],
  );
});

export default plugin;
