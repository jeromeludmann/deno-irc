import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/registration", (test) => {
  const options = {
    username: "user",
    realname: "real name",
  };

  test("register on connect", async () => {
    const { client, server } = await mock(
      options,
      { withConnection: false },
    );

    (client.state as { capabilities: typeof client.state.capabilities })
      .capabilities = [];

    await client.connect("");
    const raw = server.receive();

    assertEquals(raw, [
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("send server password if supplied", async () => {
    const { client, server } = await mock(
      { ...options, serverPassword: "password" },
      { withConnection: false },
    );

    (client.state as { capabilities: typeof client.state.capabilities })
      .capabilities = [];

    await client.connect("");
    const raw = server.receive();

    assertEquals(raw, [
      "PASS password",
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("send capabilities and register on connect", async () => {
    const { client, server } = await mock(
      options,
      { withConnection: false },
    );

    await client.connect("");
    const raw = server.receive();

    assertEquals(raw[0], "NICK me");
    assertEquals(raw[1], "USER user 0 * :real name");
    assertEquals(raw.at(-1), "CAP END");
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("cap-notify")),
      true,
    );
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("multi-prefix")),
      true,
    );
  });

  test("use nickserv auth when password supplied", async () => {
    const { client, server } = await mock(
      { ...options, password: "password" },
    );

    await client.connect("");
    const raw = server.receive();
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("cap-notify")),
      true,
    );
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("multi-prefix")),
      true,
    );
    assertEquals(raw.includes("CAP END"), true);
    assertEquals(raw.includes("NICK me"), true);
    assertEquals(raw.includes("USER user 0 * :real name"), true);
    assertEquals(
      raw.includes("PRIVMSG NickServ :identify user password"),
      true,
    );
  });

  test("send sasl capability sequence if password supplied and authMethod is sasl", async () => {
    const { client, server } = await mock(
      { ...options, password: "password", authMethod: "sasl" },
      { withConnection: false },
    );

    await client.connect("");
    server.send(":serverhost 903 user :SASL authentication successful");
    await client.once("raw:rpl_saslsuccess");
    const raw = server.receive();

    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("cap-notify")),
      true,
    );
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("multi-prefix")),
      true,
    );
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("sasl")),
      true,
    );
    assertEquals(raw.at(-3), "CAP END");
    assertEquals(raw.at(-2), "NICK me");
    assertEquals(raw.at(-1), "USER user 0 * :real name");

    server.send(":serverhost CAP me ACK :sasl");
    await client.once("raw:cap");

    assertEquals(server.receive(), [
      "AUTHENTICATE PLAIN",
    ]);

    server.send("AUTHENTICATE +");
    await client.once("raw:authenticate");

    assertEquals(server.receive(), [
      "AUTHENTICATE AHVzZXIAcGFzc3dvcmQ=",
    ]);

    server.send([
      ":serverhost 900 me me!user@host me :You are now logged in as me",
      ":serverhost 903 me :SASL authentication successful",
    ]);

    await client.once("raw:rpl_saslsuccess");
  });

  test("register on ERR_NOTREGISTERED", async () => {
    const { client, server } = await mock(options);
    server.receive();

    server.send(":serverhost 451 me :You have not registered");
    await client.once("raw:err_notregistered");
    const raw = server.receive();

    assertEquals(raw, [
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("initialize capabilities state", async () => {
    const { client } = await mock(options);
    const { capabilities } = client.state;

    assertEquals(capabilities.includes("cap-notify"), true);
    assertEquals(capabilities.includes("multi-prefix"), true);
    assertEquals(capabilities.length >= 2, true);
  });

  test("initialize user state", async () => {
    const { client } = await mock(options);
    const { user } = client.state;

    assertEquals(user, {
      nick: "me",
      username: "user",
      realname: "real name",
    });
  });

  test("update nick on RPL_WELCOME", async () => {
    const { client, server } = await mock();
    const { user } = client.state;

    server.send(":serverhost 001 new_nick :Welcome to the server");
    await client.once("register");

    assertEquals(user.nick, "new_nick");
  });

  test("track nick changes on NICK", async () => {
    const { client, server } = await mock();
    const { user } = client.state;

    server.send(":me!user@host NICK new_nick");
    await client.once("nick");

    assertEquals(user.nick, "new_nick");
  });

  test("not track nick changes on NICK", async () => {
    const { client, server } = await mock();
    const { user } = client.state;

    server.send(":someone!user@host NICK new_nick");
    await client.once("nick");

    assertEquals(user.nick, "me");
  });

  // SASL EXTERNAL tests

  test("send sasl external capability sequence", async () => {
    const { client, server } = await mock(
      { ...options, authMethod: "saslExternal" },
      { withConnection: false },
    );

    await client.connect("", { tls: true });
    server.send(":serverhost 903 user :SASL authentication successful");
    await client.once("raw:rpl_saslsuccess");
    const raw = server.receive();

    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("cap-notify")),
      true,
    );
    assertEquals(
      raw.some((r) => r.startsWith("CAP REQ") && r.includes("sasl")),
      true,
    );
    assertEquals(raw.at(-3), "CAP END");
    assertEquals(raw.at(-2), "NICK me");
    assertEquals(raw.at(-1), "USER user 0 * :real name");

    server.send(":serverhost CAP me ACK :sasl");
    await client.once("raw:cap");

    assertEquals(server.receive(), [
      "AUTHENTICATE EXTERNAL",
    ]);

    server.send("AUTHENTICATE +");
    await client.once("raw:authenticate");

    assertEquals(server.receive(), [
      "AUTHENTICATE +",
    ]);

    server.send([
      ":serverhost 900 me me!user@host me :You are now logged in as me",
      ":serverhost 903 me :SASL authentication successful",
    ]);

    await client.once("raw:rpl_saslsuccess");
  });

  test("sasl external without tls emits error", async () => {
    const { client } = await mock(
      { ...options, authMethod: "saslExternal" },
      { withConnection: false },
    );

    const errorPromise = client.once("error");
    await client.connect("");
    const error = await errorPromise;

    assertEquals(error.type, "connect");
  });

  test("sasl external failure emits error on ERR_SASLFAIL", async () => {
    const { client, server } = await mock(
      { ...options, authMethod: "saslExternal" },
      { withConnection: false },
    );

    await client.connect("", { tls: true });
    server.receive();

    const errorPromise = client.once("error");
    server.send(":serverhost 904 me :SASL authentication failed");
    const error = await errorPromise;

    assertEquals(error.type, "read");
  });

  test("sasl external failure emits error on ERR_SASLABORTED", async () => {
    const { client, server } = await mock(
      { ...options, authMethod: "saslExternal" },
      { withConnection: false },
    );

    await client.connect("", { tls: true });
    server.receive();

    const errorPromise = client.once("error");
    server.send(":serverhost 906 me :SASL authentication aborted");
    const error = await errorPromise;

    assertEquals(error.type, "read");
  });

  test("sasl external times out if server never responds", async () => {
    const { client, server } = await mock(
      { ...options, authMethod: "saslExternal", saslTimeout: 0 },
      { withConnection: false },
    );

    const errorPromise = client.once("error");
    await client.connect("", { tls: true });
    server.receive();

    const error = await errorPromise;
    assertEquals(error.type, "read");
    assertEquals(error.message, "ERROR: SASL auth failed");
  });

  test("sasl plain times out if server never responds", async () => {
    const { client, server } = await mock(
      { ...options, password: "password", authMethod: "sasl", saslTimeout: 0 },
      { withConnection: false },
    );

    const errorPromise = client.once("error");
    await client.connect("");
    server.receive();

    const error = await errorPromise;
    assertEquals(error.type, "read");
    assertEquals(error.message, "ERROR: SASL auth failed");
  });
});
