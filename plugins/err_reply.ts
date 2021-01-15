import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { AnyError } from "../core/protocol.ts";

export interface ErrReplyParams {
  events: {
    "err_reply": ErrReply;
  };
}

export interface ErrReply {
  command: AnyError;
  params: string[];
  text: string;
}

export const errReply: Plugin<ErrReplyParams> = (client) => {
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
    } as ErrReply);
  };

  client.on("raw", emitErrReply);
};
