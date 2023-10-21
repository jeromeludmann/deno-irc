import { MockClient } from "./../testing/client.ts";
import { Server as MockWebSocketServer } from "npm:mock-socket";
import { assertEquals, assertNotEquals } from "../deps.ts";
import { delay, describe } from "../testing/helpers.ts";

describe("plugins/websocket", (test) => {
  const fakeHost = "localhost";
  const fakeUrl = `ws://${fakeHost}`;
  const clientMessages = [
    "NICK me",
    "USER me 0 * me",
    "CAP REQ multi-prefix",
    "CAP END",
  ];
  const serverMessage = ":localhost 001 me :Hello from the server, me";
  const decoder = new TextDecoder();
  test("Connects to server and attempts to register", async () => {
    const client = new MockClient({
      nick: "me",
      websocket: true,
    });
    const server = new MockWebSocketServer(fakeUrl);

    let messageCounter = 0;
    server.on("connection", (socket) => {
      socket.on("message", (payload) => {
        const array = payload as Uint8Array;
        const data = decoder.decode(array);
        assertEquals(data, clientMessages[messageCounter++]);
        // Send rpl_welcome when client is done
        if (messageCounter >= 4) {
          socket.send(serverMessage);
        }
      });
    });

    await client.connect(fakeHost);
    // Required to execute websocket micro tasks
    await delay(50);

    server.close();
    client.disconnect();
  });

  test("Handles text and TLS protocols", async () => {
    const secureHost = "localhost";
    const secureUrl = "wss://localhost";
    const client = new MockClient({
      nick: "me",
      websocket: true,
    });
    const server = new MockWebSocketServer(secureUrl, {
      selectProtocol: () => "text.ircv3.net",
    });
    let messageCounter = 0;
    server.on("connection", (socket) => {
      socket.on("message", (payload) => {
        const data = payload as string;
        assertEquals(data, clientMessages[messageCounter++]);
        // Send rpl_welcome when client is done
        if (messageCounter === 4) {
          socket.send(serverMessage);
          messageCounter = 0;
        }
      });
    });

    // Test undefined port codepath
    await client.connect(secureHost, undefined, true);
    // Required to execute websocket micro tasks
    await delay(50);
    client.disconnect();

    // Test manual port codepath
    await client.connect(secureHost, 443, true);
    await delay(50);

    server.close();
    client.disconnect();
  });

  test("Client handles and passes error states", async () => {
    const client = new MockClient({
      nick: "me",
      websocket: true,
    });
    let server = new MockWebSocketServer(fakeUrl);
    // Ensure error events are passed
    const errorMessage = "failed!";
    const errorTest = (error: Error) => {
      assertEquals(error.message, errorMessage);
    };
    client.on("error", errorTest);
    client.emitError("read", Error(errorMessage));
    await delay(25);
    client.off("error", errorTest);
    client.disconnect();
    // Ensure invalid state on connect handled
    const connectErrorTest = (error: Error) => {
      console.log(error.message);
      assertNotEquals(error.message, undefined);
    };
    client.on("error", connectErrorTest);
    server.close();
    await client.connect(fakeHost);
    await delay(25);
    client.disconnect();
    // Ensure double connect works
    server = new MockWebSocketServer(fakeUrl);
    await client.connect(fakeHost);
    await delay(25);
    await client.connect(fakeHost);
    await delay(25);
    server.close();
    client.disconnect();
  });
});
