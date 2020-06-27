import { isChannel, isNick, isServerHost, isUserMask } from "./helpers.ts";
import { assertEquals } from "./test_deps.ts";

Deno.test("isUserMask", () => {
  assertEquals(isUserMask("serverhost"), false);
  assertEquals(isUserMask("nick!user@host"), true);
});

Deno.test("isServerHost", () => {
  assertEquals(isServerHost("nick!user@host"), false);
  assertEquals(isServerHost("serverhost"), true);
});

Deno.test("isChannel", () => {
  assertEquals(isChannel("nick"), false);
  assertEquals(isChannel("#channel"), true);
  assertEquals(isChannel("&channel"), true);
  assertEquals(isChannel("!channel"), true);
  assertEquals(isChannel("+channel"), true);
});

Deno.test("isNick", () => {
  assertEquals(isNick("#channel"), false);
  assertEquals(isNick("nick"), true);
});
