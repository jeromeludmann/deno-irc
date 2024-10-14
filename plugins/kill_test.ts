import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/kill", (test) => {
  test("send KILL", async () => {
    const { client, server } = await mock();

    client.kill("someone", "Boom!");
    const raw = server.receive();

    assertEquals(raw, ["KILL someone Boom!"]);
  });

  test("emit 'kill' on KILL", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host KILL me Boom!");
    const msg = await client.once("kill");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { nick: "me", comment: "Boom!" },
    });
  });
});
