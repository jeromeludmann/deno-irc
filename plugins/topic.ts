import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

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

function commands(client: ExtendedClient<TopicParams>) {
  client.topic = client.send.bind(client, "TOPIC");
}

function events(client: ExtendedClient<TopicParams>) {
  client.on("raw", (msg) => {
    switch (msg.command) {
      case "TOPIC": {
        const origin = parseUserMask(msg.prefix);
        const [channel, topic] = msg.params;
        return client.emit("topic_change", { origin, channel, topic });
      }

      case "RPL_TOPIC": {
        const [, channel, topic] = msg.params;
        return client.emit("topic_set", { channel, topic });
      }

      case "RPL_NOTOPIC": {
        const [, channel] = msg.params;
        return client.emit("topic_set", { channel, topic: undefined });
      }

      case "RPL_TOPICWHOTIME": {
        const [, channel, who, timestamp] = msg.params;
        const time = new Date(parseInt(timestamp, 10) * 1000);
        return client.emit("topic_set_by", { channel, who, time });
      }
    }
  });
}

export const topic = createPlugin(commands, events);
