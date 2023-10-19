import { MockClient } from "./../testing/client.ts";
import { Server as MockWebSocketServer } from "npm:mock-socket";
import { assertEquals } from "../deps.ts";
import { delay, describe } from "../testing/helpers.ts";

describe("plugins/websocket", (test) => {
  test("Connects to server and attempts to register", async () => {
    const clientMessages = [
      "NICK me\r\n",
      "USER me 0 * me\r\n",
      "CAP REQ multi-prefix\r\n",
      "CAP END\r\n",
    ];
    const serverMessage = ":localhost 001 me :Hello from the server, me";
    const fakeHost = "localhost";
    const fakeUrl = `ws://${fakeHost}`;
    const decoder = new TextDecoder();
    let messageCounter = 0;

    const client = new MockClient({
      nick: "me",
      websocket: true,
    });
    const server = new MockWebSocketServer(fakeUrl);
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
});
