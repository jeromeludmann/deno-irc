/** Runtime-agnostic connection interface. */
export interface Conn {
  read(buffer: Uint8Array): Promise<number | null>;

  write(bytes: Uint8Array): Promise<number>;

  close(): void;
}

/** Options for plain TCP connections. */
export interface ConnectOptions {
  hostname: string;
  port: number;
}

/** Options for TLS connections. */
export interface ConnectTlsOptions extends ConnectOptions {
  caCerts?: string[];
  cert?: string;
  key?: string;
}

/** Runtime-specific connection, I/O, and error handling. */
export interface Runtime {
  connect(opts: ConnectOptions): Promise<Conn>;

  connectTls(opts: ConnectTlsOptions): Promise<Conn>;

  readTextFileSync(path: string): string;

  isSilentError(error: unknown): boolean;
}
