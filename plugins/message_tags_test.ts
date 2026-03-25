import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/message_tags", (test) => {
  test("push 'message-tags' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("message-tags"), true);
  });

  test("send TAGMSG without tags", async () => {
    const { client, server } = await mock();

    client.tagmsg("#channel");
    const raw = server.receive();

    assertEquals(raw, ["TAGMSG #channel"]);
  });

  test("send TAGMSG with tags", async () => {
    const { client, server } = await mock();

    client.tagmsg("#channel", { "+typing": "active" });
    const raw = server.receive();

    assertEquals(raw, ["@+typing=active TAGMSG #channel"]);
  });

  test("send TAGMSG with tag without value", async () => {
    const { client, server } = await mock();

    client.tagmsg("#channel", { "+typing": undefined });
    const raw = server.receive();

    assertEquals(raw, ["@+typing TAGMSG #channel"]);
  });

  test("emit 'tagmsg:channel' on channel TAGMSG", async () => {
    const { client, server } = await mock();

    server.send("@+example=value :nick!user@host TAGMSG #channel");
    const msg = await client.once("tagmsg:channel");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: {
        target: "#channel",
        tags: { "+example": "value" },
      },
    });
  });

  test("emit 'tagmsg:private' on private TAGMSG", async () => {
    const { client, server } = await mock();

    server.send("@+typing=active :nick!user@host TAGMSG me");
    const msg = await client.once("tagmsg:private");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: {
        target: "me",
        tags: { "+typing": "active" },
      },
    });
  });

  test("emit 'tagmsg' multi-event", async () => {
    const { client, server } = await mock();

    const tagmsgPromise = client.once("tagmsg");
    server.send("@+example=test :nick!user@host TAGMSG #channel");
    const msg = await tagmsgPromise;

    assertEquals(msg.params.target, "#channel");
    assertEquals(msg.params.tags["+example"], "test");
  });

  test("handle TAGMSG without tags", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host TAGMSG #channel");
    const msg = await client.once("tagmsg");

    assertEquals(msg.params.tags, {});
  });
});
