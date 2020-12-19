import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { quit } from "./quit.ts";
import { throwOnError } from "./throw_on_error.ts";

describe("plugins/quit", (test) => {
  const plugins = [quit, throwOnError];

  test("send QUIT", async () => {
    const { client, server } = await mock(
      plugins,
      {},
      { withConnection: false },
    );

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

    assertEquals(raw, [
      "QUIT",
      "QUIT Goodbye!",
    ]);
    assertEquals(connections, [
      null,
      null,
    ]);
  });

  test("emit 'quit' on QUIT", async () => {
    const { client, server } = await mock(plugins, {});
    const messages = [];

    server.send(":someone!user@host QUIT");
    messages.push(await client.once("quit"));

    server.send(":someone!user@host QUIT :Goodbye!");
    messages.push(await client.once("quit"));

    assertEquals(messages, [
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        comment: undefined,
      },
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        comment: "Goodbye!",
      },
    ]);
  });
});
