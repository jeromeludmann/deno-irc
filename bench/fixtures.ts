// Pre-built IRC message corpus for all benchmarks.
// Defined once at module load to avoid GC pressure inside measured loops.

export const MSG_PLAIN = ":nick!user@host PRIVMSG #channel :Hello world";

export const MSG_TAGGED =
  "@time=2024-01-01T00:00:00Z;msgid=abc123 :nick!user@host PRIVMSG #channel :Hello";

export const MSG_NUMERIC =
  ":server.example.com 001 me :Welcome to the IRC Network";

export const MSG_NOTICE =
  ":server.example.com NOTICE * :*** Looking up your hostname...";

function batch(msgs: string[]): string {
  return msgs.join("\r\n") + "\r\n";
}

// Batches terminated with \r\n for Parser.parseMessages()
export const BATCH_1000_PLAIN = batch(
  Array.from({ length: 1000 }, () => MSG_PLAIN),
);

export const BATCH_1000_MIXED = batch([
  ...Array.from({ length: 250 }, () => MSG_PLAIN),
  ...Array.from({ length: 250 }, () => MSG_TAGGED),
  ...Array.from({ length: 250 }, () => MSG_NUMERIC),
  ...Array.from({ length: 250 }, () => MSG_NOTICE),
]);

// Arrays of raw lines for MockServer.send() — fits in default 4096-byte buffer
export const SEND_80_PLAIN = Array.from({ length: 80 }, () => MSG_PLAIN);
