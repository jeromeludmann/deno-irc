import { stripAnsiCode } from "@std/fmt/colors";

export interface MockConsoleOutput {
  stdout: unknown[][];
  stderr: unknown[][];
}

export function mockConsole(): MockConsoleOutput {
  const output = { stdout: [], stderr: [] };

  console.info = mock(output.stdout);
  console.warn = mock(output.stderr);
  console.error = mock(output.stderr);

  return output;
}

function mock(output: unknown[][]) {
  return (...args: string[]) => {
    output.push(
      args.map((arg) => typeof arg === "string" ? stripAnsiCode(arg) : arg),
    );
  };
}
