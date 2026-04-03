import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/labeled_response", (test) => {
  test("push 'labeled-response' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("labeled-response"),
      true,
    );
  });

  test("send labeled command with @label tag", async () => {
    const { client, server } = await mock();

    client.labeled("WHOIS", "nick");

    const raw = server.receive();
    assertEquals(raw.length, 1);
    assertEquals(raw[0].startsWith("@label=L1 WHOIS nick"), true);
  });

  test("increment label counter", async () => {
    const { client, server } = await mock();

    client.labeled("WHOIS", "nick1");
    client.labeled("WHOIS", "nick2");

    const raw = server.receive();
    assertEquals(raw[0].includes("@label=L1"), true);
    assertEquals(raw[1].includes("@label=L2"), true);
  });
});
