export class ModuleError extends Error {
  cause?: Error;

  constructor(...params: [message: string] | [error: Error]) {
    const [error] = params;

    if (typeof error === "string") {
      super(error);
    } else {
      super(error.message);
      this.cause = error;
    }
  }
}

export class ConnectError extends ModuleError {
  name = ConnectError.name;
}

export class ReceiveError extends ModuleError {
  name = ReceiveError.name;
}

export class SendError extends ModuleError {
  name = SendError.name;
}

export class DisconnectError extends ModuleError {
  name = DisconnectError.name;
}
