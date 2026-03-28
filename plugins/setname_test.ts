import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/setname", (test) => {
  test("push 'setname' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.caps.requested.includes("setname"), true);
  });

  test("send SETNAME", async () => {
    const { client, server } = await mock();

    client.setname("New Real Name");
    const raw = server.receive();

    assertEquals(raw, ["SETNAME :New Real Name"]);
  });

  test("emit 'setname' on SETNAME", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host SETNAME :New Real Name");
    const msg = await client.once("setname");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { realname: "New Real Name" },
    });
  });
});
