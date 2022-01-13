import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { errReplyPlugin } from "./err_reply.ts";

describe("plugins/err_reply", (test) => {
  const plugins = [errReplyPlugin];

  test("emit 'err_reply' on ERR_NOSUCHCHANNEL", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 403 #null :No such channel");
    const error = await client.once("err_reply");

    assertEquals(error, {
      command: "ERR_NOSUCHCHANNEL",
      params: ["#null"],
      text: "No such channel",
    });
  });

  test("emit 'err_reply' on ERR_UNKNOWNCOMMAND", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 421 TEST :Unknown command");
    const error = await client.once("err_reply");

    assertEquals(error, {
      command: "ERR_UNKNOWNCOMMAND",
      params: ["TEST"],
      text: "Unknown command",
    });
  });

  test("emit 'err_reply' on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 432 * 0nick :Erroneous Nickname");
    const error = await client.once("err_reply");

    assertEquals(error, {
      command: "ERR_ERRONEUSNICKNAME",
      params: ["*", "0nick"],
      text: "Erroneous Nickname",
    });
  });

  test("emit 'err_reply' on ERR_NOTREGISTERED", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 451 :You have not registered");
    const error = await client.once("err_reply");

    assertEquals(error, {
      command: "ERR_NOTREGISTERED",
      params: [],
      text: "You have not registered",
    });
  });
});
