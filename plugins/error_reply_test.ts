import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/error_reply", (test) => {
  test("emit 'error_reply' on ERR_NOSUCHCHANNEL", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 403 #null :No such channel");
    const error = await client.once("error_reply");

    assertEquals(error, {
      source: { name: "serverhost" },
      command: "403", // ERR_NOSUCHCHANNEL
      params: { values: ["#null"], text: "No such channel" },
    });
  });

  test("emit 'error_reply' on ERR_UNKNOWNCOMMAND", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 421 TEST :Unknown command");
    const error = await client.once("error_reply");

    assertEquals(error, {
      source: { name: "serverhost" },
      command: "421", // ERR_UNKNOWNCOMMAND
      params: { values: ["TEST"], text: "Unknown command" },
    });
  });

  test("emit 'error_reply' on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 432 * 0nick :Erroneous Nickname");
    const error = await client.once("error_reply");

    assertEquals(error, {
      source: { name: "serverhost" },
      command: "432", // ERR_ERRONEUSNICKNAME
      params: { values: ["*", "0nick"], text: "Erroneous Nickname" },
    });
  });

  test("emit 'error_reply' on ERR_NOTREGISTERED", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 451 :You have not registered");
    const error = await client.once("error_reply");

    assertEquals(error, {
      source: { name: "serverhost" },
      command: "451", // ERR_NOTREGISTERED
      params: { values: [], text: "You have not registered" },
    });
  });
});
