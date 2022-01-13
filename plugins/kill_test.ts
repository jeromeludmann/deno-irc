import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { killPlugin } from "./kill.ts";

describe("plugins/kill", (test) => {
  const plugins = [killPlugin];

  test("send KILL", async () => {
    const { client, server } = await mock(plugins, {});

    client.kill("someone", "Boom!");
    const raw = server.receive();

    assertEquals(raw, ["KILL someone Boom!"]);
  });

  test("emit 'kill' on KILL", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host KILL me Boom!");
    const msg = await client.once("kill");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      nick: "me",
      comment: "Boom!",
    });
  });
});
