import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { oper } from "./oper.ts";
import { operOnRegister } from "./oper_on_register.ts";
import { register } from "./register.ts";

describe("plugins/oper_on_register", (test) => {
  const plugins = [operOnRegister, oper, register];

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
