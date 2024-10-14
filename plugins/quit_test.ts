import { assertArrayIncludes, assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/quit", (test) => {
  test("send QUIT", async () => {
    const { client, server } = await mock({}, { withConnection: false });

    const raw = [];
    const connections = [];

    await client.connect("");
    raw.push(
      ...(await Promise.all([
        client.quit(),
        server.receive(),
      ]))[1],
    );
    connections.push(client.conn);

    await client.connect("");
    raw.push(
      ...(await Promise.all([
        client.quit("Goodbye!"),
        server.receive(),
      ]))[1],
    );
    connections.push(client.conn);

    assertArrayIncludes(raw, [
      "QUIT",
      "QUIT Goodbye!",
    ]);
    assertEquals(connections, [
      null,
      null,
    ]);
  });

  test("emit 'quit' on QUIT", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(":someone!user@host QUIT");
    messages.push(await client.once("quit"));

    server.send(":someone!user@host QUIT :Goodbye!");
    messages.push(await client.once("quit"));

    assertEquals(messages, [
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { comment: undefined },
      },
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { comment: "Goodbye!" },
      },
    ]);
  });
});
