import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/oper", (test) => {
  test("send OPER", async () => {
    const { client, server } = await mock();

    client.oper("user", "pass");
    const raw = server.receive();

    assertEquals(raw, ["OPER user pass"]);
  });
});
