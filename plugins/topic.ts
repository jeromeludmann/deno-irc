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
  client.topic = sendTopic;
  client.on("raw", emitTopicChange);
  client.on("raw", emitTopicSet);
  client.on("raw", emitTopicSetBy);

  function sendTopic(...params: string[]) {
    client.send("TOPIC", ...params);
  }

  function emitTopicChange(msg: Raw) {
    if (msg.command !== "TOPIC") {
      return;
    }

    const origin = parseUserMask(msg.prefix);
    const [channel, topic] = msg.params;

    return client.emit("topic_change", {
      origin,
      channel,
      topic,
    });
  }

  function emitTopicSet(msg: Raw) {
    switch (msg.command) {
      case "RPL_TOPIC": {
        const [, channel, topic] = msg.params;

        return client.emit("topic_set", {
          channel,
          topic,
        });
      }

      case "RPL_NOTOPIC": {
        const [, channel] = msg.params;

        return client.emit("topic_set", {
          channel,
          topic: undefined,
        });
      }
    }
  }

  function emitTopicSetBy(msg: Raw) {
    if (msg.command !== "RPL_TOPICWHOTIME") {
      return;
    }

    const [, channel, who, timestamp] = msg.params;
    const time = timestampToDate(timestamp);

    return client.emit("topic_set_by", {
      channel,
      who,
      time,
    });
  }
};

function timestampToDate(timestamp: string) {
  return new Date(parseInt(timestamp, 10) * 1000);
}
