import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/whois", (test) => {
  test("send WHOIS", async () => {
    const { client, server } = await mock();

    client.whois("someone");
    client.whois("serverhost", "someone");
    const raw = server.receive();

    assertEquals(raw, [
      "WHOIS someone",
      "WHOIS serverhost someone",
    ]);
  });

  test("emit 'whois_reply' on RPL_ENDOFWHOIS", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 311 me someone username userhost * :real name",
      ":serverhost 319 me someone :@#channel1 +#channel2 #channel3",
      ":serverhost 312 me someone serverhost :IRC Server",
      ":serverhost 317 me someone 3600 :seconds idle",
      ":serverhost 313 me someone :is an IRC operator",
      ":serverhost 301 me someone :is away",
      ":serverhost 318 me someone :End of /WHOIS list.",
    ]);
    const msg = await client.once("whois_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        nick: "someone",
        host: "userhost",
        username: "username",
        realname: "real name",
        channels: ["@#channel1", "+#channel2", "#channel3"],
        server: "serverhost",
        serverInfo: "IRC Server",
        idle: 3600,
        operator: "is an IRC operator",
        away: "is away",
      },
    });
  });
});
