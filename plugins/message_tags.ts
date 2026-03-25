import { type Message } from "../core/parsers.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import chantypes from "./chantypes.ts";

/** Parameters carried by a tagmsg event. */
export interface TagmsgEventParams {
  /** Target of the TAGMSG. */
  target: string;

  /** Tags attached to the message. */
  tags: Record<string, string | undefined>;
}

/** Emitted when a TAGMSG (tags-only message) is received. */
export type TagmsgEvent = Message<TagmsgEventParams>;

interface MessageTagsFeatures {
  commands: {
    /** Sends a TAGMSG to a target, optionally with client tags. */
    tagmsg: (
      target: string,
      tags?: Record<string, string | undefined>,
    ) => void;
  };
  events: {
    "tagmsg": TagmsgEvent;
    "tagmsg:channel": TagmsgEvent;
    "tagmsg:private": TagmsgEvent;
  };
}

const plugin: Plugin<MessageTagsFeatures, AnyPlugins> = createPlugin(
  "message_tags",
  [cap, chantypes],
)((client) => {
  client.state.capabilities.push("message-tags");

  // Sends TAGMSG command.

  client.tagmsg = (target, tags) => {
    if (tags) {
      client.send(tags, "TAGMSG", target);
    } else {
      client.send("TAGMSG", target);
    }
  };

  // Emits "tagmsg:*" events.

  client.on("raw:tagmsg", (msg) => {
    const { source, tags, params: [target] } = msg;

    const targetType = client.utils.isChannel(target) ? "channel" : "private";
    const event = `tagmsg:${targetType}` as const;

    client.emit(event, {
      source,
      params: { target, tags: tags ?? {} },
    });
  });

  client.createMultiEvent(
    "tagmsg",
    ["tagmsg:channel", "tagmsg:private"],
  );
});

export default plugin;
