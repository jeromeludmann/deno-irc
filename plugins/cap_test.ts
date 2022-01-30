import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/cap", (test) => {
  test("initialize capabilities state", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities, ["multi-prefix"]);
  });

  test("send CAP", async () => {
    const { client, server } = await mock();

    client.cap("REQ", "capability");
    const raw = server.receive();

    assertEquals(raw, ["CAP REQ capability"]);
  });
});
