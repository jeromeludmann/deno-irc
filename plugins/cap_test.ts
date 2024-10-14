import { assertEquals } from "@std/assert";
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

  test("send capabilities", async () => {
    const { client, server } = await mock();

    client.state.capabilities.push("cap1");
    client.utils.negotiateCapabilities({ completeImmediately: true });

    assertEquals(server.receive(), [
      "CAP REQ multi-prefix", // already provided by plugins/names
      "CAP REQ cap1", // provided by previous capabilities.push()
      "CAP END",
    ]);

    client.utils.negotiateCapabilities({
      extraCaps: ["cap2"],
      completeImmediately: true,
    });

    assertEquals(server.receive(), [
      "CAP REQ multi-prefix",
      "CAP REQ cap1",
      "CAP REQ cap2", // provided by sendCapabilities()
      "CAP END",
    ]);
  });
});
