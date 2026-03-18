import { type Message, parseSource, type Source } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Parameters for a channel topic change event. */
export interface TopicEventParams {
  /** Channel where the topic is set. */
  channel: string;

  /** New topic of the channel. */
  topic?: string;
}

/** Event emitted when a channel topic is changed. */
export type TopicEvent = Message<TopicEventParams>;

/** Event emitted in response to a TOPIC query (RPL_TOPIC or RPL_NOTOPIC). */
export type TopicReplyEvent = Message<TopicEventParams>;

/** Parameters for a RPL_TOPICWHOTIME reply (who set the topic and when). */
export interface TopicWhoTimeReplyEventParams {
  /** Channel where the topic is set. */
  channel: string;

  /** User who set the topic. */
  who: Source;

  /** Date time of the topic. */
  time: Date;
}

/** Event emitted with metadata about who set the topic and when. */
export type TopicWhoTimeReplyEvent = Message<TopicWhoTimeReplyEventParams>;

interface TopicFeatures {
  commands: {
    /** Gets the `topic` of a `channel`. */
    topic(channel: string): void;

    /** Changes the `topic` of a `channel`. */
    topic(channel: string, topic: string): void;
  };
  events: {
    "topic": TopicEvent;
    "topic_reply": TopicReplyEvent;
    "topic_who_time_reply": TopicWhoTimeReplyEvent;
  };
}

const plugin: Plugin<TopicFeatures> = createPlugin("topic")((client) => {
  // Sends TOPIC command.

  client.topic = (...params: string[]) => {
    client.send("TOPIC", ...params);
  };

  // Emits 'topic' event.

  client.on("raw:topic", (msg) => {
    const { source, params: [channel, topic] } = msg;
    client.emit("topic", { source, params: { channel, topic } });
  });

  // Emits 'topic_reply' event.

  client.on("raw:rpl_topic", (msg) => {
    const { source, params: [, channel, topic] } = msg;
    client.emit("topic_reply", { source, params: { channel, topic } });
  });

  client.on("raw:rpl_notopic", (msg) => {
    const { source, params: [, channel] } = msg;
    const topic = undefined;
    client.emit("topic_reply", { source, params: { channel, topic } });
  });

  // Emits 'topic_reply_by' event.

  client.on("raw:rpl_topicwhotime", (msg) => {
    const { source, params: [, channel, mask, timestamp] } = msg;
    const time = new Date(parseInt(timestamp, 10) * 1000);
    const who = parseSource(mask);
    client.emit("topic_who_time_reply", {
      source,
      params: { channel, who, time },
    });
  });
});

export default plugin;
