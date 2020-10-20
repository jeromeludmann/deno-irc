import type { ExtendedClient, UserMask } from "../core/mod.ts";
import { createPlugin, parseUserMask } from "../core/mod.ts";

export interface Commands {
  topic(channel: string, topic?: string): void;
}

export interface Events {
  "topic_change": TopicChange;
  "topic_set": TopicSet;
  "topic_set_by": TopicSetBy;
}

export interface TopicChange {
  origin: UserMask;
  channel: string;
  topic: string;
}

export interface TopicSet {
  channel: string;
  topic?: string;
}

export interface TopicSetBy {
  channel: string;
  who: string; // can be a nick or an unparsed mask, depending on the server
  time: Date;
}

export interface TopicPluginParams {
  commands: Commands;
  events: Events;
}

function commands(client: ExtendedClient<TopicPluginParams>) {
  client.topic = client.send.bind(client, "TOPIC");
}

function events(client: ExtendedClient<TopicPluginParams>) {
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

export const plugin = createPlugin(commands, events);
