import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { serverError } from "./server_error.ts";

describe("plugins/server_error", (test) => {
  const plugins = [serverError];

  test("emit 'error' on ERROR", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("ERROR :Closing link: (user@host) [Client exited]");
    const error = await client.once("error");

    assertEquals(error.type, "plugin");
    assertEquals(
      error.message,
      "plugin: Closing link: (user@host) [Client exited]",
    );
  });
});
