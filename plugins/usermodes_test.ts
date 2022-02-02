import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/usermodes", (test) => {
  test("", async () => {
    const { client } = await mock();

    assertEquals(client.state.usermodes, {
      "a": { type: "d" },
      "i": { type: "d" },
      "o": { type: "d" },
      "O": { type: "d" },
      "r": { type: "d" },
      "s": { type: "d" },
      "w": { type: "d" },
    });
  });
});
