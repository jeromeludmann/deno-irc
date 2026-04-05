import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/who", (test) => {
  test("send WHO", async () => {
    const { client, server } = await mock();

    client.who("#channel");
    const raw = server.receive();

    assertEquals(raw, ["WHO #channel"]);
  });

  test("send WHOX with fields and token", async () => {
    const { client, server } = await mock();

    client.who("#channel", { fields: "nuhsra", token: "42" });
    const raw = server.receive();

    assertEquals(raw, ["WHO #channel %nuhsra,42"]);
  });

  test("send WHOX with auto-generated token", async () => {
    const { client, server } = await mock();

    client.who("#channel", { fields: "nuhs" });
    const raw = server.receive();

    assertEquals(raw.length, 1);
    assertEquals(raw[0].startsWith("WHO #channel %nuhs,"), true);
  });

  test("emit 'who_reply' on standard WHO", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 352 me #channel user1 host1 server1 nick1 H :0 Real Name 1",
      ":serverhost 352 me #channel user2 host2 server2 nick2 G* :2 Real Name 2",
      ":serverhost 315 me #channel :End of /WHO list",
    ]);

    const msg = await client.once("who_reply");

    assertEquals(msg.source, { name: "serverhost" });
    assertEquals(msg.params.target, "#channel");
    assertEquals(msg.params.entries.length, 2);

    assertEquals(msg.params.entries[0], {
      channel: "#channel",
      username: "user1",
      host: "host1",
      server: "server1",
      nick: "nick1",
      flags: "H",
      hopcount: 0,
      realname: "Real Name 1",
    });

    assertEquals(msg.params.entries[1], {
      channel: "#channel",
      username: "user2",
      host: "host2",
      server: "server2",
      nick: "nick2",
      flags: "G*",
      hopcount: 2,
      realname: "Real Name 2",
    });
  });

  test("emit 'who_reply' with WHOX response", async () => {
    const { client, server } = await mock();

    client.who("#channel", { fields: "nuhsra", token: "99" });
    server.receive(); // consume sent command

    server.send([
      ":serverhost 354 me 99 nick1 user1 host1",
      ":serverhost 315 me #channel :End of /WHO list",
    ]);

    const msg = await client.once("who_reply");

    assertEquals(msg.params.target, "#channel");
    assertEquals(msg.params.entries.length, 1);
    assertEquals(msg.params.entries[0].token, "99");
    assertEquals(msg.params.entries[0].whoxParams![0], "99");
  });

  test("emit 'who_reply' for empty channel", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 315 me #empty :End of /WHO list");

    const msg = await client.once("who_reply");

    assertEquals(msg.params.target, "#empty");
    assertEquals(msg.params.entries, []);
  });

  test("handle WHO reply without trailing param", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 352 me #channel user host server nick H",
      ":serverhost 315 me #channel :End of /WHO list",
    ]);

    const msg = await client.once("who_reply");

    assertEquals(msg.params.entries[0].hopcount, undefined);
    assertEquals(msg.params.entries[0].realname, undefined);
  });

  test("handle WHOX reply with unknown token", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 354 me unknown_token nick1 user1 host1",
      ":serverhost 315 me unknown_token :End of /WHO list",
    ]);

    const msg = await client.once("who_reply");

    assertEquals(msg.params.target, "unknown_token");
    assertEquals(msg.params.entries.length, 1);
  });

  test("handle WHO reply with hopcount only (no realname)", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 352 me #channel user host server nick H :3",
      ":serverhost 315 me #channel :End of /WHO list",
    ]);

    const msg = await client.once("who_reply");

    assertEquals(msg.params.entries[0].hopcount, 3);
    assertEquals(msg.params.entries[0].realname, undefined);
  });
});
