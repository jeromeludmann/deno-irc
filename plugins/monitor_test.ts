import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/monitor", (test) => {
  test("initialize monitor state", async () => {
    const { client } = await mock();

    assertEquals(client.state.monitorList instanceof Set, true);
    assertEquals(client.state.monitorList.size, 0);
    assertEquals(client.state.monitorLimit, 0);
  });

  test("send MONITOR + (add)", async () => {
    const { client, server } = await mock();

    client.monitor.add("nick1");
    assertEquals(server.receive(), ["MONITOR + nick1"]);

    client.monitor.add(["nick2", "nick3"]);
    assertEquals(server.receive(), ["MONITOR + nick2,nick3"]);
  });

  test("track added nicks in monitorList", async () => {
    const { client } = await mock();

    client.monitor.add(["nick1", "nick2"]);

    assertEquals(client.state.monitorList.has("nick1"), true);
    assertEquals(client.state.monitorList.has("nick2"), true);
  });

  test("send MONITOR - (remove)", async () => {
    const { client, server } = await mock();

    client.monitor.add("nick1");
    server.receive();

    client.monitor.remove("nick1");
    assertEquals(server.receive(), ["MONITOR - nick1"]);
    assertEquals(client.state.monitorList.has("nick1"), false);
  });

  test("send MONITOR - with array (remove)", async () => {
    const { client, server } = await mock();

    client.monitor.add(["nick1", "nick2"]);
    server.receive();

    client.monitor.remove(["nick1", "nick2"]);
    assertEquals(server.receive(), ["MONITOR - nick1,nick2"]);
    assertEquals(client.state.monitorList.size, 0);
  });

  test("send MONITOR L (list)", async () => {
    const { client, server } = await mock();

    client.monitor.list();
    assertEquals(server.receive(), ["MONITOR L"]);
  });

  test("send MONITOR C (clear)", async () => {
    const { client, server } = await mock();

    client.monitor.add(["nick1", "nick2"]);
    server.receive();

    client.monitor.clear();
    assertEquals(server.receive(), ["MONITOR C"]);
    assertEquals(client.state.monitorList.size, 0);
  });

  test("send MONITOR S (status)", async () => {
    const { client, server } = await mock();

    client.monitor.status();
    assertEquals(server.receive(), ["MONITOR S"]);
  });

  test("emit 'monitor_online' on RPL_MONONLINE", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 730 me :nick1!user@host,nick2!user@host");
    const msg = await client.once("monitor_online");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nicks: ["nick1", "nick2"] },
    });
  });

  test("emit 'monitor_offline' on RPL_MONOFFLINE", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 731 me :nick1,nick2");
    const msg = await client.once("monitor_offline");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nicks: ["nick1", "nick2"] },
    });
  });

  test("emit 'monitor_list' on RPL_ENDOFMONLIST with buffered entries", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 732 me :nick1,nick2",
      ":serverhost 732 me :nick3",
      ":serverhost 733 me :End of MONITOR list",
    ]);

    const msg = await client.once("monitor_list");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nicks: ["nick1", "nick2", "nick3"] },
    });
  });

  test("emit 'monitor_list' for empty list", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 733 me :End of MONITOR list");
    const msg = await client.once("monitor_list");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nicks: [] },
    });
  });

  test("set monitorLimit from ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 005 me MONITOR=100 :are supported by this server");
    await client.once("isupport:monitor");

    assertEquals(client.state.monitorLimit, 100);
  });

  test("ignore ISUPPORT MONITOR without value", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 005 me MONITOR :are supported by this server");
    await client.once("isupport:monitor");

    assertEquals(client.state.monitorLimit, 0);
  });

  test("handle RPL_MONLIST with empty targets", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 732 me",
      ":serverhost 733 me :End of MONITOR list",
    ]);

    const msg = await client.once("monitor_list");
    assertEquals(msg.params, { nicks: [] });
  });
});
