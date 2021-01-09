import { Plugin } from "../core/client.ts";
import { parseUserMask, Raw, UserMask } from "../core/parsers.ts";

export interface TopicParams {
  commands: {
    /** Gets the `topic` of a `channel`. */
    topic(channel: string): void;

    /** Changes the `topic` of a `channel`. */
    topic(channel: string, topic: string): void;
  };

  events: {
    "topic_change": TopicChange;
    "topic_set": TopicSet;
    "topic_set_by": TopicSetBy;
  };
}

export interface TopicChange {
  /** User who changed the topic. */
  origin: UserMask;

  /** Channel where the topic is changed. */
  channel: string;

  /** New topic of the channel. */
  topic: string;
}

export interface TopicSet {
  /** Channel where the topic is set. */
  channel: string;

  /** New topic of the channel. */
  topic?: string;
}

export interface TopicSetBy {
  /** Channel where the topic is set. */
  channel: string;

  /** User who set the topic. */
  who: string; // can be a nick or an unparsed mask, depending on the server

  /** Date time of the topic. */
  time: Date;
}

export const topic: Plugin<TopicParams> = (client) => {
  const sendTopic = (...params: string[]) => {
    client.send("TOPIC", ...params);
  };

  const emitTopicChange = (msg: Raw) => {
    if (msg.command !== "TOPIC") {
      return;
    }

    const { prefix, params: [channel, topic] } = msg;
    const origin = parseUserMask(prefix);

    client.emit("topic_change", { origin, channel, topic });
  };

  const emitTopicSet = (msg: Raw) => {
    switch (msg.command) {
      case "RPL_TOPIC": {
        const { params: [, channel, topic] } = msg;
        client.emit("topic_set", { channel, topic });
        break;
      }
      case "RPL_NOTOPIC": {
        const { params: [, channel] } = msg;
        const topic = undefined;
        client.emit("topic_set", { channel, topic });
        break;
      }
    }
  };

  const emitTopicSetBy = (msg: Raw) => {
    if (msg.command !== "RPL_TOPICWHOTIME") {
      return;
    }

    const { params: [, channel, who, timestamp] } = msg;
    const time = new Date(parseInt(timestamp, 10) * 1000);

    client.emit("topic_set_by", { channel, who, time });
  };

  client.topic = sendTopic;
  client.on("raw", emitTopicChange);
  client.on("raw", emitTopicSet);
  client.on("raw", emitTopicSetBy);
};
