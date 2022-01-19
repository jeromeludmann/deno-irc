import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { isChannel } from "./strings.ts";

describe("core/strings", (test) => {
  test("check channel", () => {
    assertEquals(isChannel("nick"), false);
    assertEquals(isChannel("#channel"), true);
    assertEquals(isChannel("&channel"), true);
    assertEquals(isChannel("!channel"), true);
    assertEquals(isChannel("+channel"), true);
  });
});
