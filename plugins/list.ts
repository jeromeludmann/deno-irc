import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";

export interface Channel {
  /** Name of the channel. */
  channel: string;

  /** Client count. */
  count: number;

  /** Topic of this channel. */
  topic: string;
}

export interface ListReplyEvent {
  /** The entire channel list. */
  channels: Channel[];
}

export interface ListParams {
  commands: {
    /** Gets the list channels and their topics.
     *
     * Replies with 'list_reply' event when ended. */
    list(channels?: string | string[], server?: string): void;
  };
  events: {
    "list_reply": ListReplyEvent;
  };
}

export const listPlugin: Plugin<ListParams> = (client) => {
  const sendList = (channels?: string | string[], server?: string) => {
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

  const emitList = (msg: Raw) => {
    switch (msg.command) {
      case "RPL_LISTSTART": {
        buffer = [];
        break;
      }
      case "RPL_LIST": {
        const [, channel, count, topic = ""] = msg.params;
        buffer.push({ channel, count: parseInt(count, 10), topic });
        break;
      }
      case "RPL_LISTEND": {
        client.emit("list_reply", { channels: buffer });
        buffer = []; // useful because sometimes RPL_LISTSTART could not be sent
        break;
      }
    }
  };

  let buffer: Channel[] = [];

  client.list = sendList;
  client.on("raw", emitList);
};
