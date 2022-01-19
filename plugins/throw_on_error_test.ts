import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/throw_on_error", (test) => {
  test("emit 'error' on ERROR", async () => {
    const { client, server } = await mock();

    server.send("ERROR :Closing link: (user@host) [Client exited]");
    const error = await client.once("error");

    assertEquals(error.type, "read");
    assertEquals(
      error.message,
      "ERROR: Closing link: (user@host) [Client exited]",
    );
  });
});
