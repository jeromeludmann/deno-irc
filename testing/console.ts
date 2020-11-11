import { stripColor } from "../deps.ts";

export interface MockConsole {
  stdout: any[][];
  stderr: any[][];
}

export function mockConsole(): MockConsole {
  const stdout: any[][] = [];
  const stderr: any[][] = [];

  console.info = console.log = mock(stdout);
  console.warn = console.error = mock(stderr);

  return { stdout, stderr };
}

function mock(output: any[][]) {
  return (...args: any[]) => {
    output.push(
      args.map((arg) => typeof arg === "string" ? stripColor(arg) : arg),
    );
  };
}
