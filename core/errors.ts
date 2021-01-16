export type ClientErrorType = "connect" | "read" | "write" | "close";

export interface ClientError extends Error {
  type: ClientErrorType;
}

export type ErrorArgs = [
  type: ClientErrorType,
  error: Error,
] | [
  type: ClientErrorType,
  error: string,
  // deno-lint-ignore ban-types
  callSite: Function,
];

export function toClientError(
  ...[type, error, callSite]: ErrorArgs
): ClientError {
  if (typeof error === "string") {
    error = new Error(error);
    Error.captureStackTrace(error, callSite);
  }

  (error as ClientError).type = type;

  return error as ClientError;
}
