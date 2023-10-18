import { PORT } from "../core/client.ts";
import { parseMessage } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import { StandardWebSocketClient, WebSocketClient } from "../deps.ts";

interface WebsocketFeatures {
  options: {
    websocket?: boolean;
  };
}

export default createPlugin("websocket", [])<WebsocketFeatures>(
  (client, options) => {
    if (!options.websocket) return;

    let websocket: WebSocketClient | null = null;

    const openHandler = () => {
      client.emit("connected", client.state.remoteAddr);
    };

    const messageHandler = (message: MessageEvent) => {
      try {
        const msg = parseMessage(message.data);
        client.emit(`raw:${msg.command}`, msg);
      } catch (error) {
        client.emitError("read", error);
      }
    };

    const errorHandler = (error: string | symbol) => {
      client.emitError("read", new Error(error.toString()));
    };

    client.hooks.hookCall("connect", async (_, hostname, port, tls) => {
      port = port ?? PORT;
      const websocketPrefix = tls ? "wss://" : "ws://";
      const websocketUrl = `${websocketPrefix}${hostname}:${port}`;
      if (websocket !== null) {
        await websocket.close(0);
      }

      client.state.remoteAddr = { hostname, port, tls };
      const { remoteAddr } = client.state;
      client.emit("connecting", remoteAddr);

      try {
        websocket = new StandardWebSocketClient(websocketUrl);
        websocket.on("error", errorHandler);
        websocket.on("open", openHandler);
        websocket.on("message", messageHandler);
      } catch (error) {
        client.emitError("connect", error);
        return null;
      }

      return null;
    });

    client.hooks.hookCall("send", (_, command, ...params) => {
      if (websocket === null) {
        client.emitError("write", "Unable to send message", client.send);
        return null;
      }
      // Removes undefined trailing parameters.
      for (let i = params.length - 1; i >= 0; --i) {
        params[i] === undefined ? params.pop() : i = 0;
      }

      // Prefixes trailing parameter with ':'.
      const last = params.length - 1;
      if (
        params.length > 0 &&
        (params[last]?.[0] === ":" || params[last]?.includes(" ", 1))
      ) {
        params[last] = ":" + params[last];
      }

      // Prepares and encodes raw message.
      const raw = (command + " " + params.join(" ")).trimEnd() + "\r\n";
      const bytes = client.encoder.encode(raw);

      try {
        websocket.send(bytes);
        return raw;
      } catch (error) {
        client.emitError("write", error);
        return null;
      }
    });

    client.hooks.hookCall("disconnect", async () => {
      try {
        await websocket?.close(0);
        client.emit("disconnected", client.state.remoteAddr);
      } catch (error) {
        client.emitError("close", error);
      } finally {
        websocket = null;
      }
    });
  },
);
