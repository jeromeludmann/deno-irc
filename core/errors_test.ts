import { assertEquals, assertMatch } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { toClientError } from "./errors.ts";

describe("core/errors", (test) => {
  test("convert Error to ClientError", () => {
    const error = toClientError("read", new Error("Boom!"));

    assertEquals(error.type, "read");
    assertEquals(error.name, "Error");
    assertEquals(error.message, "read: Boom!");
    assertMatch(error.stack!, /^Error: read: Boom!/);
  });

  test("convert string and call site to ClientError", () => {
    const error = toClientError("write", "Boom!", () => {});

    assertEquals(error.type, "write");
    assertEquals(error.name, "Error");
    assertEquals(error.message, "write: Boom!");
    assertMatch(error.stack!, /^Error: write: Boom!/);
  });
});
