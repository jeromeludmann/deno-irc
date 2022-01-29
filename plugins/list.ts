import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export interface Channel {
  /** Name of the channel. */
  name: string;

  /** Client count. */
  count: number;

  /** Topic of this channel. */
  topic: string;
}

export interface ListReplyEventParams {
  /** The entire channel list. */
  channels: Channel[];
}

export type ListReplyEvent = Message<ListReplyEventParams>;

interface ListFeatures {
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

export default createPlugin("list")<ListFeatures>((client) => {
  let buffer: Channel[] = [];

  // Sends LIST command.

  client.list = (channels, server) => {
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

  // Emits 'list_reply' event.
  // Accumulates channel list parts into buffer
  // and emits a `list_reply` event once ended.

  client.on("raw:rpl_liststart", () => {
    buffer = [];
  });

  client.on("raw:rpl_list", (msg) => {
    const [, name, count, topic = ""] = msg.params;
    buffer.push({ name, count: parseInt(count, 10), topic });
  });

  client.on("raw:rpl_listend", (msg) => {
    const { source } = msg;
    client.emit("list_reply", { source, params: { channels: buffer } });
    buffer = []; // useful because sometimes RPL_LISTSTART could not be sent
  });
});
