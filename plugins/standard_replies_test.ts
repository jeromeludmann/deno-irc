import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/standard_replies", (test) => {
  test("emit 'fail' on FAIL without context", async () => {
    const { client, server } = await mock();

    server.send(":server FAIL COMMAND CODE :description text");
    const msg = await client.once("fail");

    assertEquals(msg, {
      source: { name: "server" },
      params: {
        command: "COMMAND",
        code: "CODE",
        context: [],
        description: "description text",
      },
    });
  });

  test("emit 'fail' on FAIL with context", async () => {
    const { client, server } = await mock();

    server.send(":server FAIL COMMAND CODE ctx1 ctx2 :description text");
    const msg = await client.once("fail");

    assertEquals(msg, {
      source: { name: "server" },
      params: {
        command: "COMMAND",
        code: "CODE",
        context: ["ctx1", "ctx2"],
        description: "description text",
      },
    });
  });

  test("emit 'warn' on WARN", async () => {
    const { client, server } = await mock();

    server.send(":server WARN COMMAND CODE :warning message");
    const msg = await client.once("warn");

    assertEquals(msg, {
      source: { name: "server" },
      params: {
        command: "COMMAND",
        code: "CODE",
        context: [],
        description: "warning message",
      },
    });
  });

  test("emit 'note' on NOTE", async () => {
    const { client, server } = await mock();

    server.send(":server NOTE COMMAND CODE :info message");
    const msg = await client.once("note");

    assertEquals(msg, {
      source: { name: "server" },
      params: {
        command: "COMMAND",
        code: "CODE",
        context: [],
        description: "info message",
      },
    });
  });
});
