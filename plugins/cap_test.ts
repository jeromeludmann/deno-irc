import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

const tick = () => new Promise((r) => setTimeout(r, 10));

// After mock(), there is a pending CAP LS 302 from the initial connect.
// This helper responds to it so tests start with a clean state.
async function mockWithCaps(
  availableCaps = "cap-notify multi-prefix",
) {
  const result = await mock();
  const { client, server } = result;

  // Respond to the pending CAP LS from initial connect
  server.send(`:server CAP me LS :${availableCaps}`);
  await client.once("raw:cap");
  await tick();
  server.receive(); // discard the initial CAP REQ + any pending writes

  return result;
}

describe("plugins/cap", (test) => {
  test("initialize capabilities state", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("cap-notify"),
      true,
    );
    assertEquals(
      client.state.caps.requested.includes("multi-prefix"),
      true,
    );
  });

  test("initialize enabledCapabilities state", async () => {
    const { client } = await mock();

    assertEquals(client.state.caps.enabled instanceof Set, true);
    assertEquals(client.state.caps.enabled.size, 0);
  });

  test("initialize availableCapabilities state", async () => {
    const { client } = await mock();

    assertEquals(client.state.caps.available instanceof Set, true);
    assertEquals(client.state.caps.available.size, 0);
  });

  test("send CAP", async () => {
    const { client, server } = await mock();

    client.cap("REQ", "capability");
    const raw = server.receive();

    assertEquals(raw, ["CAP REQ capability"]);
  });

  test("negotiate sends CAP LS 302 then REQ after LS response", async () => {
    const { client, server } = await mockWithCaps();

    client.utils.negotiateCapabilities({ completeImmediately: true });
    assertEquals(server.receive(), ["CAP LS 302"]);

    server.send(
      ":server CAP me LS :cap-notify multi-prefix server-time echo-message",
    );
    await client.once("raw:cap");
    await tick();

    const raw = server.receive();
    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(typeof capReq, "string");
    assertEquals(capReq!.includes("cap-notify"), true);
    assertEquals(capReq!.includes("multi-prefix"), true);

    // Server ACKs → client sends CAP END (completeImmediately)
    server.send(":server CAP me ACK :cap-notify multi-prefix");
    await client.once("cap:ack");
    await tick();

    assertEquals(server.receive(), ["CAP END"]);
  });

  test("negotiate filters unsupported caps", async () => {
    const { client, server } = await mockWithCaps();

    client.utils.negotiateCapabilities({
      extraCaps: ["unsupported-cap"],
      completeImmediately: true,
    });
    server.receive(); // CAP LS 302

    server.send(":server CAP me LS :cap-notify multi-prefix");
    await client.once("raw:cap");
    await tick();
    const raw = server.receive();

    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(typeof capReq, "string");
    assertEquals(capReq!.includes("unsupported-cap"), false);
    assertEquals(capReq!.includes("cap-notify"), true);
  });

  test("negotiate handles multiline CAP LS 302", async () => {
    const { client, server } = await mockWithCaps();

    client.utils.negotiateCapabilities({ completeImmediately: true });
    server.receive(); // CAP LS 302

    server.send(":server CAP me LS * :cap-notify multi-prefix");
    await client.once("raw:cap");
    await tick();

    // No REQ yet — waiting for final LS line
    assertEquals(server.receive().length, 0);

    server.send(":server CAP me LS :server-time echo-message");
    await client.once("raw:cap");
    await tick();

    const raw = server.receive();
    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(typeof capReq, "string");
    assertEquals(client.state.caps.available.has("cap-notify"), true);
    assertEquals(
      client.state.caps.available.has("server-time"),
      true,
    );
  });

  test("negotiate strips capability values from LS", async () => {
    const { client, server } = await mockWithCaps();

    client.utils.negotiateCapabilities({
      extraCaps: ["sasl"],
      completeImmediately: true,
    });
    server.receive(); // CAP LS 302

    server.send(":server CAP me LS :cap-notify sasl=PLAIN,EXTERNAL");
    await client.once("raw:cap");
    await tick();

    assertEquals(client.state.caps.available.has("sasl"), true);
    const raw = server.receive();
    const capReq = raw.find((r) => r.startsWith("CAP REQ"));
    assertEquals(capReq!.includes("sasl"), true);
  });

  test("negotiate sends CAP END when no caps are supported", async () => {
    const { client, server } = await mockWithCaps("unknown-only");

    client.utils.negotiateCapabilities({
      completeImmediately: true,
    });
    server.receive(); // CAP LS 302

    server.send(":server CAP me LS :still-unknown");
    await client.once("raw:cap");
    await tick();

    assertEquals(server.receive(), ["CAP END"]);
  });

  test("negotiate sends CAP END on NAK with completeImmediately", async () => {
    const { client, server } = await mockWithCaps();

    client.utils.negotiateCapabilities({ completeImmediately: true });
    server.receive(); // CAP LS 302

    server.send(":server CAP me LS :cap-notify multi-prefix");
    await client.once("raw:cap");
    await tick();
    server.receive(); // CAP REQ

    server.send(":server CAP me NAK :cap-notify multi-prefix");
    await client.once("cap:nak");
    await tick();

    assertEquals(server.receive(), ["CAP END"]);
  });

  test("track CAP ACK", async () => {
    const { client, server } = await mock();

    const ackPromise = client.once("cap:ack");
    server.send(":server CAP me ACK :multi-prefix cap-notify");
    const msg = await ackPromise;

    assertEquals(msg.params.caps, ["multi-prefix", "cap-notify"]);
    assertEquals(client.state.caps.enabled.has("multi-prefix"), true);
    assertEquals(client.state.caps.enabled.has("cap-notify"), true);
  });

  test("track CAP NAK", async () => {
    const { client, server } = await mock();

    const nakPromise = client.once("cap:nak");
    server.send(":server CAP me NAK :unsupported-cap");
    const msg = await nakPromise;

    assertEquals(msg.params.caps, ["unsupported-cap"]);
    assertEquals(
      client.state.caps.enabled.has("unsupported-cap"),
      false,
    );
  });

  test("track CAP NEW and auto-request declared caps", async () => {
    const { client, server } = await mock();

    const newPromise = client.once("cap:new");
    server.send(":server CAP me NEW :multi-prefix some-other-cap");
    const msg = await newPromise;

    assertEquals(msg.params.caps, ["multi-prefix", "some-other-cap"]);
    assertEquals(
      client.state.caps.available.has("multi-prefix"),
      true,
    );

    const raw = server.receive();
    assertEquals(raw, ["CAP REQ multi-prefix"]);
  });

  test("track CAP DEL", async () => {
    const { client, server } = await mock();

    server.send(":server CAP me ACK :multi-prefix");
    await client.once("cap:ack");
    assertEquals(client.state.caps.enabled.has("multi-prefix"), true);

    const delPromise = client.once("cap:del");
    server.send(":server CAP me DEL :multi-prefix");
    const msg = await delPromise;

    assertEquals(msg.params.caps, ["multi-prefix"]);
    assertEquals(client.state.caps.enabled.has("multi-prefix"), false);
    assertEquals(
      client.state.caps.available.has("multi-prefix"),
      false,
    );
  });
});
