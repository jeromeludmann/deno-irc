import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { isChannel, isNick, isServerHost, isUserMask } from "./helpers.ts";

describe("core/helpers", (test) => {
  test("check user mask", () => {
    assertEquals(isUserMask("serverhost"), false);
    assertEquals(isUserMask("nick!user@host"), true);
  });

  test("check server host", () => {
    assertEquals(isServerHost("nick!user@host"), false);
    assertEquals(isServerHost("serverhost"), true);
  });

  test("check channel", () => {
    assertEquals(isChannel("nick"), false);
    assertEquals(isChannel("#channel"), true);
    assertEquals(isChannel("&channel"), true);
    assertEquals(isChannel("!channel"), true);
    assertEquals(isChannel("+channel"), true);
  });

  test("check nick", () => {
    assertEquals(isNick("#channel"), false);
    assertEquals(isNick("nick"), true);
  });
});
