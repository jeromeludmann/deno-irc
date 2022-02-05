import { type Raw } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";

export default createPlugin("throw_on_error")((client) => {
  // Wraps server ERROR message into an `Error` object.
  // It will throw error if there are no error listeners bound to it.

  const emitError = (msg: Raw) => {
    const message = "ERROR: " + msg.params.join(": ");
    client.emitError("read", message, emitError);
  };

  client.on("raw:error", emitError);
});
