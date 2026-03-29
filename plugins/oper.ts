import { createPlugin, type Plugin } from "../core/plugins.ts";

export interface OperFeatures {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };

  state: {
    oper: boolean;
  };
}

const plugin: Plugin<OperFeatures> = createPlugin("oper")((client) => {
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

export default plugin;
