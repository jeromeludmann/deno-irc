import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/cap", (test) => {
  test("initialize capabilities state", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("cap-notify"), true);
    assertEquals(client.state.capabilities.includes("multi-prefix"), true);
  });

  test("initialize enabledCapabilities state", async () => {
    const { client } = await mock();

    assertEquals(client.state.enabledCapabilities instanceof Set, true);
    assertEquals(client.state.enabledCapabilities.size, 0);
  });

  test("send CAP", async () => {
    const { client, server } = await mock();

    client.cap("REQ", "capability");
    const raw = server.receive();

    assertEquals(raw, ["CAP REQ capability"]);
  });

  test("send capabilities in single CAP REQ", async () => {
    const { client, server } = await mock();

    client.utils.negotiateCapabilities({ completeImmediately: true });
    const raw = server.receive();

    // All caps are batched in a single CAP REQ
    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(typeof capReq, "string");
    for (const cap of client.state.capabilities) {
      assertEquals(capReq!.includes(cap), true);
    }
    assertEquals(raw[raw.length - 1], "CAP END");
  });

  test("send extra capabilities in single CAP REQ", async () => {
    const { client, server } = await mock();

    client.utils.negotiateCapabilities({
      extraCaps: ["extra-cap"],
      completeImmediately: true,
    });
    const raw = server.receive();

    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(capReq!.includes("extra-cap"), true);
    assertEquals(raw[raw.length - 1], "CAP END");
  });

  test("track CAP ACK", async () => {
    const { client, server } = await mock();

    const ackPromise = client.once("cap:ack");
    server.send(":server CAP me ACK :multi-prefix cap-notify");
    const msg = await ackPromise;

    assertEquals(msg.params.caps, ["multi-prefix", "cap-notify"]);
    assertEquals(client.state.enabledCapabilities.has("multi-prefix"), true);
    assertEquals(client.state.enabledCapabilities.has("cap-notify"), true);
  });

  test("track CAP NAK", async () => {
    const { client, server } = await mock();

    const nakPromise = client.once("cap:nak");
    server.send(":server CAP me NAK :unsupported-cap");
    const msg = await nakPromise;

    assertEquals(msg.params.caps, ["unsupported-cap"]);
    assertEquals(
      client.state.enabledCapabilities.has("unsupported-cap"),
      false,
    );
  });

  test("track CAP NEW and auto-request declared caps", async () => {
    const { client, server } = await mock();

    const newPromise = client.once("cap:new");
    server.send(":server CAP me NEW :multi-prefix some-other-cap");
    const msg = await newPromise;

    assertEquals(msg.params.caps, ["multi-prefix", "some-other-cap"]);

    const raw = server.receive();
    assertEquals(raw, ["CAP REQ multi-prefix"]);
  });

  test("track CAP DEL", async () => {
    const { client, server } = await mock();

    server.send(":server CAP me ACK :multi-prefix");
    await client.once("cap:ack");
    assertEquals(client.state.enabledCapabilities.has("multi-prefix"), true);

    const delPromise = client.once("cap:del");
    server.send(":server CAP me DEL :multi-prefix");
    const msg = await delPromise;

    assertEquals(msg.params.caps, ["multi-prefix"]);
    assertEquals(client.state.enabledCapabilities.has("multi-prefix"), false);
  });
});
