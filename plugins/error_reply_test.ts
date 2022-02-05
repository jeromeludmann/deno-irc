import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/error_reply", (test) => {
  test("emit 'error_reply' on ERR_NOSUCHCHANNEL", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 403 #null :No such channel");
    const msg = await client.once("error_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      command: "err_nosuchchannel",
      params: { args: ["#null"], text: "No such channel" },
    });
  });

  test("emit 'error_reply' on ERR_UNKNOWNCOMMAND", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 421 TEST :Unknown command");
    const msg = await client.once("error_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      command: "err_unknowncommand",
      params: { args: ["TEST"], text: "Unknown command" },
    });
  });

  test("emit 'error_reply' on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 432 * 0nick :Erroneous Nickname");
    const msg = await client.once("error_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      command: "err_erroneusnickname",
      params: { args: ["*", "0nick"], text: "Erroneous Nickname" },
    });
  });

  test("emit 'error_reply' on ERR_NOTREGISTERED", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 451 :You have not registered");
    const msg = await client.once("error_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      command: "err_notregistered",
      params: { args: [], text: "You have not registered" },
    });
  });
});
