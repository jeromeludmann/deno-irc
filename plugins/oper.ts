import { createPlugin } from "../core/plugins.ts";

interface OperFeatures {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };

  state: {
    oper: boolean;
  };
}

export default createPlugin("oper")<OperFeatures>((client) => {
  client.state.oper = false;

  // Sends OPER command.

  client.oper = (user, pass) => {
    client.send("OPER", user, pass);
  };

  // Updates 'oper' state.

  client.on("raw:rpl_youreoper", () => {
    client.state.oper = true;
  });

  // Resets 'oper' state.

  client.on(["disconnected", "error"], () => {
    client.state.oper = false;
  });
});
