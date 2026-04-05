import { assertEquals } from "@std/assert";
import { delay, describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/batch", (test) => {
  test("push 'batch' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("batch"),
      true,
    );
  });

  test("emit 'batch_start' on BATCH +ref", async () => {
    const { client, server } = await mock();

    server.send(":server BATCH +abc chathistory #channel");
    const msg = await client.once("batch_start");

    assertEquals(msg, {
      source: { name: "server" },
      params: { ref: "abc", type: "chathistory", params: ["#channel"] },
    });
  });

  test("emit 'batch_end' on BATCH -ref with collected messages", async () => {
    const { client, server } = await mock();

    server.send([
      ":server BATCH +abc chathistory #channel",
      "@batch=abc :nick!user@host PRIVMSG #channel :hello",
      "@batch=abc :nick!user@host PRIVMSG #channel :world",
      ":server BATCH -abc",
    ]);

    const msg = await client.once("batch_end");

    assertEquals(msg.source, { name: "server" });
    assertEquals(msg.params.ref, "abc");
    assertEquals(msg.params.type, "chathistory");
    assertEquals(msg.params.params, ["#channel"]);
    assertEquals(msg.params.messages.length, 2);
    assertEquals(msg.params.messages[0].params, ["#channel", "hello"]);
    assertEquals(msg.params.messages[1].params, ["#channel", "world"]);
  });

  test("suppress raw:* events for batched messages", async () => {
    const { client, server } = await mock();

    let rawEmitted = false;
    client.on("raw:privmsg", () => {
      rawEmitted = true;
    });

    server.send([
      ":server BATCH +abc chathistory #channel",
      "@batch=abc :nick!user@host PRIVMSG #channel :hello",
      ":server BATCH -abc",
    ]);

    await client.once("batch_end");

    assertEquals(rawEmitted, false);
  });

  test("do not suppress raw:* events for non-batched messages", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host PRIVMSG #channel :hello");
    const msg = await client.once("raw:privmsg");

    assertEquals(msg.params, ["#channel", "hello"]);
  });

  test("handle nested batches", async () => {
    const { client, server } = await mock();

    const batches: { ref: string; type: string; count: number }[] = [];
    client.on("batch_end", (msg) => {
      batches.push({
        ref: msg.params.ref,
        type: msg.params.type,
        count: msg.params.messages.length,
      });
    });

    server.send([
      ":server BATCH +outer netsplit",
      "@batch=outer :server BATCH +inner netjoin",
      "@batch=inner :nick!user@host JOIN #channel",
      ":server BATCH -inner",
      ":server BATCH -outer",
    ]);

    await delay();

    assertEquals(batches.length, 2);
    // inner batch closes first with its collected JOIN message
    assertEquals(batches[0].ref, "inner");
    assertEquals(batches[0].count, 1);
    // outer batch has no direct non-batch messages
    // (BATCH +/-inner are handled separately, not collected as messages)
    assertEquals(batches[1].ref, "outer");
    assertEquals(batches[1].type, "netsplit");
    assertEquals(batches[1].count, 0);
  });

  test("ignore BATCH with no ref param", async () => {
    const { client, server } = await mock();

    let started = false;
    client.on("batch_start", () => {
      started = true;
    });

    server.send(":server BATCH");
    await delay();

    assertEquals(started, false);
  });

  test("pass through message with unknown batch tag", async () => {
    const { client, server } = await mock();

    server.send("@batch=unknown :nick!user@host PRIVMSG #ch :hello");
    const msg = await client.once("raw:privmsg");

    assertEquals(msg.params, ["#ch", "hello"]);
  });

  test("ignore unknown BATCH -ref", async () => {
    const { client, server } = await mock();

    let endEmitted = false;
    client.on("batch_end", () => {
      endEmitted = true;
    });

    server.send(":server BATCH -unknown");
    await delay();

    assertEquals(endEmitted, false);
  });

  test("cleanup batches on disconnect", async () => {
    const { client, server } = await mock();

    server.send(":server BATCH +abc chathistory #channel");
    await client.once("batch_start");

    assertEquals(client.state.batches.size, 1);

    server.shutdown();
    await client.once("disconnected");

    assertEquals(client.state.batches.size, 0);
  });

  test("preserve tags from opening BATCH line in batch_end", async () => {
    const { client, server } = await mock();

    server.send([
      "@label=L1 :server BATCH +abc labeled-response",
      "@batch=abc :server 311 me nick user host * :realname",
      ":server BATCH -abc",
    ]);

    const msg = await client.once("batch_end");

    assertEquals(msg.params.tags?.label, "L1");
  });
});
