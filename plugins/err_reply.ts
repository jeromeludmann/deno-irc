import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { AnyError } from "../core/protocol.ts";

export interface ErrReplyEvent {
  command: AnyError;
  params: string[];
  text: string;
}

export interface ErrReplyParams {
  events: {
    "err_reply": ErrReplyEvent;
  };
}

export const errReplyPlugin: Plugin<ErrReplyParams> = (client) => {
  const emitErrReply = (msg: Raw) => {
    if (!msg.command.startsWith("ERR_")) {
      return;
    }

    const { command, params: p } = msg;
    const params = p.slice(0, p.length - 1);
    const text = p[p.length - 1];

    client.emit("err_reply", {
      command,
      params,
      text,
    } as ErrReplyEvent);
  };

  client.on("raw", emitErrReply);
};
