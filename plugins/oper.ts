import { createPlugin } from "../core/plugins.ts";

interface OperFeatures {
  commands: {
    /** Sets the client as operator with a `user` and a `password`.  */
    oper(user: string, password: string): void;
  };
}

export default createPlugin("oper")<OperFeatures>((client) => {
  // Sends OPER command.
  client.oper = (user, pass) => {
    client.send("OPER", user, pass);
  };
});
