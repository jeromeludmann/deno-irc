import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export interface ChannelListParams {
  commands: {
    /** Gets the list channels and their topics. */
    list(channels?: string | string[], server?: string): void;
  };

  events: {
    "channel_list_reply": ChannelListReply;
    "channel_list_item_reply": ChannelListItemReply;
  };
}

export interface ChannelListReply {
  /** The entire channel list. */
  channelList: ChannelListItemReply[];
}

export interface ChannelListItemReply {
  /** Name of the channel. */
  channel: string;

  /** Client count. */
  count: number;

  /** Topic of this channel. */
  topic: string;
}

export const channelList: Plugin<ChannelListParams> = (client) => {
  let currentChannelList: ChannelListItemReply[] = [];

  const sendChannelList = (channels?: string | string[], server?: string) => {
    const params: string[] = [];

    if (channels !== undefined) {
      if (!Array.isArray(channels)) channels = [channels];
      params.push(channels.join(","));
    }

    if (server !== undefined) {
      params.push(server);
    }

    client.send("LIST", ...params);
  };

  const emitChannelList = (msg: Raw) => {
    switch (msg.command) {
      case "RPL_LISTSTART": {
        currentChannelList = [];
        break;
      }
      case "RPL_LIST": {
        const [, channel, count, topic = ""] = msg.params;
        const channelListItem = { channel, count: parseInt(count, 10), topic };
        client.emit("channel_list_item_reply", channelListItem);
        currentChannelList.push(channelListItem);
        break;
      }
      case "RPL_LISTEND": {
        client.emit("channel_list_reply", { channelList: currentChannelList });
        currentChannelList = []; // useful if RPL_LISTSTART has not been received
        break;
      }
    }
  };

  client.list = sendChannelList;
  client.on("raw", emitChannelList);
};