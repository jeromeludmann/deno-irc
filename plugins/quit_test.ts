import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { quit } from "./quit.ts";
import { serverError } from "./server_error.ts";

describe("plugins/quit", (test) => {
  const plugins = [quit, serverError];

  test("send QUIT", async () => {
    const { client, server } = await mock(plugins, {});

    client.quit();
    client.quit("Goodbye!");
    const raw = server.receive();

    assertEquals(raw, [
      "QUIT",
      "QUIT Goodbye!",
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
