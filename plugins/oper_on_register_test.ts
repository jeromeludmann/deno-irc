import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { operPlugin } from "./oper.ts";
import { operOnRegisterPlugin } from "./oper_on_register.ts";
import { registerPlugin } from "./register.ts";

describe("plugins/oper_on_register", (test) => {
  const plugins = [operOnRegisterPlugin, operPlugin, registerPlugin];

  test("oper on RPL_WELCOME", async () => {
    const { client, server } = await mock(
      plugins,
      { oper: { user: "user", pass: "pass" } },
    );

    server.send(":serverhost 001 nick :Welcome to the server");
    await client.once("register");
    const raw = server.receive();

    assertEquals(raw, ["OPER user pass"]);
  });

  test("not oper on RPL_WELCOME if disabled", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 001 nick :Welcome to the server");
    await client.once("register");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});
