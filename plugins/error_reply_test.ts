import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { type ErrorReplyEvent } from "./error_reply.ts";

describe("plugins/error_reply", (test) => {
  test("emit 'error_reply' on error replies", async () => {
    const { client, server } = await mock();

    const messages: ErrorReplyEvent[] = [];
    client.on("error_reply", (msg) => messages.push(msg));

    server.send([
      ":serverhost 001 nick :Welcome to the server",
      ":serverhost 400 nick :Unknown error",
      ":serverhost 005 nick PREFIX=(ohv)@%+ :are supported by this server",
      ":serverhost 421 TEST :Unknown command",
    ]);

    await client.once("raw");

    assertEquals(messages, [{
      source: { name: "serverhost" },
      command: "err_unknownerror", // 400
      params: { args: ["nick"], text: "Unknown error" },
    }, {
      source: { name: "serverhost" },
      command: "err_unknowncommand", // 421
      params: { args: ["TEST"], text: "Unknown command" },
    }]);
  });
});
