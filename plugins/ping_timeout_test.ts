import { assertEquals, assertMatch } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/ping_timeout", (test) => {
  const delay = () => new Promise((resolve) => setTimeout(resolve, 0));

  test("send PING after period of silence", async () => {
    const { client, server } = await mock({ pingTimeout: 0 });

    server.send(":serverhost 001 me :Welcome to the server");
    await client.once("register");

    await delay();

    const [raw] = server.receive();
    client.disconnect();

    assertMatch(raw, /^PING .+$/);
  });

  test("emit 'error' if server does not reply", async () => {
    const { client, server } = await mock({ pingTimeout: 0 });

    server.send(":serverhost 001 me :Welcome to the server");
    await client.once("register");

    await delay();

    const error = await client.once("error");

    assertEquals(error.name, "Error");
    assertEquals(error.type, "read");
    assertEquals(error.message, "ERROR: Ping timeout");
  });
});
