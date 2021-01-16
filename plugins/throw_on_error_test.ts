import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { throwOnError } from "./throw_on_error.ts";

describe("plugins/throw_on_error", (test) => {
  const plugins = [throwOnError];

  test("emit 'error' on ERROR", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("ERROR :Closing link: (user@host) [Client exited]");
    const error = await client.once("error");

    assertEquals(error.type, "read");
    assertEquals(
      error.message,
      "ERROR: Closing link: (user@host) [Client exited]",
    );
  });
});
