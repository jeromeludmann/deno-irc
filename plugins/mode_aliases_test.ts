import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/mode_aliases", (test) => {
  test("send MODE using client.op", async () => {
    const { client, server } = await mock();

    client.op("#channel", "nick");
    client.op("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel +o nick",
      "MODE #channel +ooo nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.deop", async () => {
    const { client, server } = await mock();

    client.deop("#channel", "nick");
    client.deop("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel -o nick",
      "MODE #channel -ooo nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.halfop", async () => {
    const { client, server } = await mock();

    client.halfop("#channel", "nick");
    client.halfop("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel +h nick",
      "MODE #channel +hhh nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.dehalfop", async () => {
    const { client, server } = await mock();

    client.dehalfop("#channel", "nick");
    client.dehalfop("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel -h nick",
      "MODE #channel -hhh nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.voice", async () => {
    const { client, server } = await mock();

    client.voice("#channel", "nick");
    client.voice("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel +v nick",
      "MODE #channel +vvv nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.devoice", async () => {
    const { client, server } = await mock();

    client.devoice("#channel", "nick");
    client.devoice("#channel", "nick1", "nick2", "nick3");

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel -v nick",
      "MODE #channel -vvv nick1 nick2 nick3",
    ]);
  });

  test("send MODE using client.ban", async () => {
    const { client, server } = await mock();

    client.ban("#channel", "nick!user@host");
    client.ban(
      "#channel",
      "nick1!user@host",
      "nick2!user@host",
      "nick3!user@host",
    );

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel +b nick!user@host",
      "MODE #channel +bbb nick1!user@host nick2!user@host nick3!user@host",
    ]);
  });

  test("send MODE using client.unban", async () => {
    const { client, server } = await mock();

    client.unban("#channel", "nick!user@host");
    client.unban(
      "#channel",
      "nick1!user@host",
      "nick2!user@host",
      "nick3!user@host",
    );

    const raw = server.receive();

    assertEquals(raw, [
      "MODE #channel -b nick!user@host",
      "MODE #channel -bbb nick1!user@host nick2!user@host nick3!user@host",
    ]);
  });
});
