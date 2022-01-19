import { type Message, parseSource, type Source } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface TopicChangeEventParams {
  /** Channel where the topic is set. */
  channel: string;

  /** New topic of the channel. */
  topic: string;
}

export type TopicChangeEvent = Message<TopicChangeEventParams>;

export interface TopicSetEventParams {
  /** Channel where the topic is set. */
  channel: string;

  /** New topic of the channel. */
  topic: string | undefined;
}

export type TopicSetEvent = Message<TopicSetEventParams>;

export interface TopicSetByEventParams {
  /** Channel where the topic is set. */
  channel: string;

  /** User who set the topic. */
  who: Source;

  /** Date time of the topic. */
  time: Date;
}

export type TopicSetByEvent = Message<TopicSetByEventParams>;

interface TopicFeatures {
  commands: {
    /** Gets the `topic` of a `channel`. */
    topic(channel: string): void;

    /** Changes the `topic` of a `channel`. */
    topic(channel: string, topic: string): void;
  };
  events: {
    "topic_change": TopicChangeEvent;
    "topic_set": TopicSetEvent;
    "topic_set_by": TopicSetByEvent;
  };
}

export default createPlugin("topic")<TopicFeatures>((client) => {
  // Sends TOPIC command.
  client.topic = (...params: string[]) => {
    client.send("TOPIC", ...params);
  };

  // Emits 'topic_change' event.
  client.on("raw", (msg) => {
    if (msg.command === "TOPIC") {
      const { source, params: [channel, topic] } = msg;
      client.emit("topic_change", { source, params: { channel, topic } });
    }
  });

  // Emits 'topic_set' event.
  client.on("raw", (msg) => {
    switch (msg.command) {
      case "RPL_TOPIC": {
        const { source, params: [, channel, topic] } = msg;
        client.emit("topic_set", { source, params: { channel, topic } });
        break;
      }
      case "RPL_NOTOPIC": {
        const { source, params: [, channel] } = msg;
        const topic = undefined;
        client.emit("topic_set", { source, params: { channel, topic } });
        break;
      }
    }
  });

  // Emits 'topic_set_by' event.
  client.on("raw", (msg) => {
    if (msg.command === "RPL_TOPICWHOTIME") {
      const { source, params: [, channel, mask, timestamp] } = msg;
      const time = new Date(parseInt(timestamp, 10) * 1000);
      const who = parseSource(mask);
      client.emit("topic_set_by", { source, params: { channel, who, time } });
    }
  });
});
