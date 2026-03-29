import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/userhost_in_names", (test) => {
  test("push 'userhost-in-names' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("userhost-in-names"),
      true,
    );
  });

  test("parse userhost from NAMES reply", async () => {
    const { client, server } = await mock();

    server.send([
      ":server 353 me = #chan :@nick1!user1@host1 +nick2!user2@host2",
      ":server 366 me #chan :End of /NAMES list",
    ]);

    const msg = await client.once("names_reply");

    // Names should be stripped of !user@host
    assertEquals("nick1" in msg.params.names, true);
    assertEquals("nick2" in msg.params.names, true);
    assertEquals("nick1!user1@host1" in msg.params.names, false);

    // Userhosts should be populated
    assertEquals(client.state.userhosts["#chan"], {
      nick1: { user: "user1", host: "host1" },
      nick2: { user: "user2", host: "host2" },
    });
  });

  test("parse names without userhost (plain nicks)", async () => {
    const { client, server } = await mock();

    server.send([
      ":server 353 me = #chan :@nick1 +nick2",
      ":server 366 me #chan :End of /NAMES list",
    ]);

    const msg = await client.once("names_reply");

    assertEquals("nick1" in msg.params.names, true);
    assertEquals("nick2" in msg.params.names, true);

    // Userhosts should be empty for nicks without userhost info
    assertEquals(client.state.userhosts["#chan"], {});
  });

  test("accumulate multiple RPL_NAMREPLY lines", async () => {
    const { client, server } = await mock();

    server.send([
      ":server 353 me = #chan :@nick1!user1@host1",
      ":server 353 me = #chan :+nick2!user2@host2",
      ":server 366 me #chan :End of /NAMES list",
    ]);

    await client.once("names_reply");

    assertEquals(client.state.userhosts["#chan"], {
      nick1: { user: "user1", host: "host1" },
      nick2: { user: "user2", host: "host2" },
    });
  });

  test("cleanup on disconnect", async () => {
    const { client, server } = await mock();

    server.send([
      ":server 353 me = #chan :@nick1!user1@host1",
      ":server 366 me #chan :End of /NAMES list",
    ]);

    await client.once("names_reply");
    assertEquals(Object.keys(client.state.userhosts).length, 1);

    server.shutdown();
    await client.once("disconnected");

    assertEquals(Object.keys(client.state.userhosts).length, 0);
  });
});
