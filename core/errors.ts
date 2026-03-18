/** Categories of errors that can occur during client operation. */
export type ClientErrorType = "connect" | "read" | "write" | "close";

/** An error enriched with an IRC client operation type. */
export interface ClientError extends Error {
  type: ClientErrorType;
}

/** Arguments for constructing a ClientError, either from an existing error or a message string. */
export type ErrorArgs = [
  type: ClientErrorType,
  error: Error | unknown,
] | [
  type: ClientErrorType,
  error: string,
  // deno-lint-ignore ban-types
  callSite: Function,
];

/** Wraps an error or message string into a typed {@link ClientError}. */
export function toClientError(
  ...[type, error, callSite]: ErrorArgs
): ClientError {
  if (typeof error === "string") {
    error = new Error(error);
    Error.captureStackTrace(error as Error, callSite);
  }

  (error as ClientError).type = type;

  return error as ClientError;
}
