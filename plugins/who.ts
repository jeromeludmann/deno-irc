import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

/** Options for a WHO query. */
export interface WhoOptions {
  /** WHOX fields to request (e.g., "nuhsra"). Triggers WHOX format. */
  fields?: string;

  /** WHOX query token for matching replies. Auto-generated if omitted. */
  token?: string;
}

/** A single entry in a WHO reply. */
export interface WhoEntry {
  channel: string;
  username: string;
  host: string;
  server: string;
  nick: string;
  flags: string;
  hopcount?: number;
  realname?: string;
  /** WHOX token, present only for WHOX replies. */
  token?: string;
  /** Raw params for WHOX replies (field order depends on request). */
  whoxParams?: string[];
}

/** Parameters carried by a who_reply event. */
export interface WhoReplyEventParams {
  /** Target of the WHO query. */
  target: string;

  /** List of WHO entries. */
  entries: WhoEntry[];
}

/** Emitted when the full WHO reply for a target has been received. */
export type WhoReplyEvent = Message<WhoReplyEventParams>;

export interface WhoFeatures {
  commands: {
    /** Sends a WHO query for a target. */
    who(target: string, options?: WhoOptions): void;
  };
  events: {
    "who_reply": WhoReplyEvent;
  };
}

const plugin: Plugin<WhoFeatures> = createPlugin("who")((client) => {
  const buffers: Record<string, WhoEntry[]> = {};
  const tokenMap: Record<string, string> = {};
  let tokenCounter = 0;

  // Sends WHO command.

  client.who = (target, options) => {
    if (options?.fields) {
      const token = options.token ?? String(++tokenCounter);
      tokenMap[token] = target;
      client.send("WHO", target, `%${options.fields},${token}`);
    } else {
      client.send("WHO", target);
    }
  };

  // Accumulate standard WHO replies (352).

  client.on("raw:rpl_whoreply", (msg) => {
    const [, channel, username, host, server, nick, flags, trailing] =
      msg.params;
    const target = channel;
    buffers[target] ??= [];

    let hopcount: number | undefined;
    let realname: string | undefined;
    if (trailing) {
      const spaceIdx = trailing.indexOf(" ");
      if (spaceIdx !== -1) {
        hopcount = parseInt(trailing.slice(0, spaceIdx), 10);
        realname = trailing.slice(spaceIdx + 1);
      } else {
        hopcount = parseInt(trailing, 10);
      }
    }

    buffers[target].push({
      channel,
      username,
      host,
      server,
      nick,
      flags,
      hopcount,
      realname,
    });
  });

  // Accumulate WHOX replies (354).

  client.on("raw:rpl_whospcrpl", (msg) => {
    const [, ...params] = msg.params;
    // First param after nick is the token
    const token = params[0];
    const target = tokenMap[token] ?? token;
    buffers[target] ??= [];

    buffers[target].push({
      channel: "",
      username: "",
      host: "",
      server: "",
      nick: "",
      flags: "",
      token,
      whoxParams: params,
    });
  });

  // Flush buffer on RPL_ENDOFWHO (315).

  client.on("raw:rpl_endofwho", (msg) => {
    const { source, params: [, target] } = msg;

    const entries = buffers[target] ?? [];
    client.emit("who_reply", {
      source,
      params: { target, entries },
    });

    delete buffers[target];
    // Clean up token mappings for this target
    for (const [token, t] of Object.entries(tokenMap)) {
      if (t === target) delete tokenMap[token];
    }
  });

  // Clean up on disconnect.

  client.on("disconnected", () => {
    for (const key of Object.keys(buffers)) delete buffers[key];
    for (const key of Object.keys(tokenMap)) delete tokenMap[key];
  });
});

export default plugin;
