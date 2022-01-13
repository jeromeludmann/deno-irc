import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { operPlugin } from "./oper.ts";

describe("plugins/oper", (test) => {
  const plugins = [operPlugin];

  test("send OPER", async () => {
    const { client, server } = await mock(plugins, {});

    client.oper("user", "pass");
    const raw = server.receive();

    assertEquals(raw, ["OPER user pass"]);
  });
});
