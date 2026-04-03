import { parseChunk } from "../core/parsers.ts";
import {
  BATCH_1000_MIXED,
  BATCH_1000_PLAIN,
  MSG_PLAIN,
  MSG_TAGGED,
} from "./fixtures.ts";

// Single message ---

Deno.bench({
  name: "single plain PRIVMSG",
  group: "single",
  baseline: true,
  fn() {
    parseChunk(MSG_PLAIN + "\r\n");
  },
});

Deno.bench({
  name: "single tagged PRIVMSG",
  group: "single",
  fn() {
    parseChunk(MSG_TAGGED + "\r\n");
  },
});

// Batch 1000 messages ---

Deno.bench({
  name: "1000 plain PRIVMSG",
  group: "batch",
  baseline: true,
  fn() {
    parseChunk(BATCH_1000_PLAIN);
  },
});

Deno.bench({
  name: "1000 mixed messages",
  group: "batch",
  fn() {
    parseChunk(BATCH_1000_MIXED);
  },
});
