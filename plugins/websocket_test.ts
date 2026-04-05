import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { WebSocketConn } from "./websocket.ts";
import { mock } from "../testing/mock.ts";

class MockWebSocket extends EventTarget {
  binaryType = "arraybuffer";
  readyState = 1;
  protocol = "binary.ircv3.net";

  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  sent: unknown[] = [];
  closed = false;

  send(data: unknown): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
  }

  simulateMessage(data: ArrayBuffer | string | Blob): void {
    this.onmessage?.(new MessageEvent("message", { data }));
  }

  simulateClose(): void {
    this.onclose?.({ type: "close" } as CloseEvent);
  }

  simulateError(): void {
    this.onerror?.(new Event("error"));
  }
}

describe("plugins/websocket", (test) => {
  test("WebSocketConn read receives ArrayBuffer data", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    const encoder = new TextEncoder();
    const data = encoder.encode("PING :test\r\n");
    ws.simulateMessage(data.buffer as ArrayBuffer);

    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);

    assertEquals(n, data.length);
    assertEquals(buffer.subarray(0, n!), data);
  });

  test("WebSocketConn read receives string data", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    ws.simulateMessage("PING :test\r\n");

    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);

    const encoder = new TextEncoder();
    const expected = encoder.encode("PING :test\r\n");
    assertEquals(n, expected.length);
    assertEquals(buffer.subarray(0, n!), expected);
  });

  test("WebSocketConn read receives Blob data", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    const encoder = new TextEncoder();
    const data = encoder.encode("PING :test\r\n");
    const blob = new Blob([data]);
    ws.simulateMessage(blob);

    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);

    assertEquals(n, data.length);
    assertEquals(buffer.subarray(0, n!), data);
  });

  test("WebSocketConn read returns null on close", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    ws.simulateClose();

    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);

    assertEquals(n, null);
  });

  test("WebSocketConn read rejects on error", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    ws.simulateError();

    const buffer = new Uint8Array(4096);
    await assertRejects(
      () => conn.read(buffer),
      Error,
      "WebSocket error",
    );
  });

  test("WebSocketConn read rejects after error, not null", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    ws.simulateError();

    const buffer = new Uint8Array(4096);
    await assertRejects(
      () => conn.read(buffer),
      Error,
      "WebSocket error",
    );

    await assertRejects(
      () => conn.read(buffer),
      Error,
      "WebSocket error",
    );
  });

  test("WebSocketConn read pending rejects on error", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    const buffer = new Uint8Array(4096);
    const readPromise = conn.read(buffer);

    ws.simulateError();

    await assertRejects(
      () => readPromise,
      Error,
      "WebSocket error",
    );
  });

  test("WebSocketConn read pending resolves null on close", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    const buffer = new Uint8Array(4096);
    const readPromise = conn.read(buffer);

    ws.simulateClose();

    const n = await readPromise;
    assertEquals(n, null);
  });

  test("WebSocketConn write sends bytes", async () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    const encoder = new TextEncoder();
    const bytes = encoder.encode("PRIVMSG #test :hello\r\n");
    const n = await conn.write(bytes);

    assertEquals(n, bytes.length);
    assertEquals(ws.sent.length, 1);
    assertEquals(ws.sent[0], bytes);
  });

  test("WebSocketConn close calls ws.close", () => {
    const ws = new MockWebSocket();
    const conn = new WebSocketConn(ws as unknown as WebSocket);

    conn.close();

    assertEquals(ws.closed, true);
  });

  test("throw if websocket: true without port", async () => {
    const { client } = await mock(
      {},
      { withConnection: false },
    );

    assertThrows(
      () => {
        client.connect("irc.example.com", { websocket: true });
      },
      Error,
      "WebSocket requires an explicit port",
    );
  });

  test("no-op when websocket is not set", async () => {
    const { client, server } = await mock();

    const raw = server.receive();
    assertEquals(raw.length, 0);

    assertEquals(client.state.remoteAddr.websocket, undefined);
  });
});
