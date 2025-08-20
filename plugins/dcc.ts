import { type Message } from "../core/parsers.ts";
import { createPlugin } from "../core/plugins.ts";
import ctcp, { RawCtcpEvent, RawCtcpReplyEvent } from "./ctcp.ts";

/** DCC host kinds. */
type HostKind = "ipv4" | "ipv6" | "hostname";
/** Normalized host with its kind. */
type HostValue = { type: HostKind; value: string };

/** Primitive field kinds used by the DCC schema. */
type FieldKind = "string" | "number" | "ip" | "boolean";
/** Map a FieldKind to its TypeScript type. */
type FieldKindToType<K extends FieldKind> = K extends "string" ? string
  : K extends "number" ? number
  : K extends "ip" ? HostValue
  : K extends "boolean" ? boolean
  : never;

/** Strict dotted IPv4. */
const IPV4_DOTTED_RE = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
/** Permissive DNS hostname with at least one dot. */
const HOSTNAME_RE =
  /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9]{1,63}$/;
/** Unsigned decimal integer. */
const UINT_RE = /^\d+$/;
/** Matches any filename that requires quoting (space, quote, backslash). */
const FILENAME_NEEDS_QUOTE = /[\s"\\]/;
/** Matches characters inside a filename that must be escaped. */
const FILENAME_ESCAPE_CHARS = /(["\\])/g;

/**
 * DCC command schema. Each tuple: [key, kind, required].
 * Drives typed payloads per action.
 */
const DCC_SCHEMA = {
  send: [
    ["filename", "string", true],
    ["ip", "ip", true],
    ["port", "number", true],
    ["size", "number", true],
    ["token", "number", false],
  ] as const,

  schat: [
    ["ip", "ip", true],
    ["port", "number", true],
    ["token", "number", false],
    ["tls", "boolean", true],
  ] as const,

  chat: [
    ["ip", "ip", true],
    ["port", "number", true],
    ["token", "number", false],
    ["tls", "boolean", true],
  ] as const,

  resume: [
    ["filename", "string", true],
    ["port", "number", true],
    ["position", "number", true],
    ["token", "number", false],
  ] as const,

  accept: [
    ["filename", "string", true],
    ["port", "number", true],
    ["position", "number", true],
    ["token", "number", false],
  ] as const,
} as const;

/** Single schema row helper. */
type SchemaRow<
  K extends string = string,
  C extends FieldKind = FieldKind,
  R extends boolean = boolean,
> = readonly [K, C, R];

/** Full action schema as a tuple of rows. */
type Schema = readonly SchemaRow[];

/** Extract the row for key K in schema T. */
type RowForKey<T extends Schema, K extends string> = Extract<
  T[number],
  readonly [K, any, any]
>;

/** Resolve the TS type for key K in schema T. */
type TypeForKey<T extends Schema, K extends string> = RowForKey<T, K> extends
  readonly [any, infer C, any] ? FieldKindToType<Extract<C, FieldKind>>
  : never;

/** Collect all keys of a schema T. */
type AllKeysOf<T extends Schema> = T[number] extends
  readonly [infer K, any, any] ? K : never;

/** Required keys of schema T. */
type RequiredKeysOf<T extends Schema> = Extract<
  T[number],
  readonly [any, any, true]
>[0];

/** Optional keys of schema T. */
type OptionalKeysOf<T extends Schema> = Exclude<
  Extract<AllKeysOf<T>, string>,
  Extract<RequiredKeysOf<T>, string>
>;

/** Build an object type from a schema tuple. */
type ObjectFromSchema<T extends Schema> =
  & { [K in Extract<RequiredKeysOf<T>, string>]: TypeForKey<T, K> }
  & { [K in Extract<OptionalKeysOf<T>, string>]?: TypeForKey<T, K> };

/** Supported DCC actions. */
type DccAction = keyof typeof DCC_SCHEMA;

/**
 * Common DCC fields.
 * IRC servers deliver DCC only to the client itself, so `target` is not included.
 */
type DccBaseFields = {
  text: string;
};

/** Add the passive flag used in passive DCC flows. */
type WithPassiveFlag<T> = T & { passive?: boolean };

/** Payload map per DCC action. */
type DccPayloadByAction = {
  [A in DccAction]: WithPassiveFlag<
    DccBaseFields & { action: A } & ObjectFromSchema<(typeof DCC_SCHEMA)[A]>
  >;
};

/**
 * Map of emitted DCC events.
 * Keys: "dcc_send" | "dcc_chat" | "dcc_resume" | "dcc_accept".
 * Note: "schat" is normalized into "dcc_chat" with `tls: true`.
 */
export type DccEventMap = {
  [A in DccAction as `dcc_${A & string}`]: Message<
    Exclude<DccPayloadByAction[A], "schat">
  >;
};

/**
 * Payload type for a given DCC event key.
 * @typeParam K - One of the keys of {@link DccEventMap}.
 */
export type DccEventPayload<K extends keyof DccEventMap> = DccEventMap[K];

/**
 * Field kind for key K in schema T.
 * @typeParam T - A DCC schema tuple.
 * @typeParam K - Field name in the schema.
 */
type KindForKey<T extends Schema, K extends string> = RowForKey<T, K> extends
  readonly [any, infer C, any] ? Extract<C, FieldKind> : never;

/**
 * Wire type for a field kind.
 * "ip" becomes a raw string (to be serialized via fmtHost), others use {@link FieldKindToType}.
 * @typeParam C - Field kind.
 */
type WireKind<C extends FieldKind> = C extends "ip" ? string
  : FieldKindToType<C>;

/**
 * Build the user-facing args object from a schema.
 * Required keys are required. Optional keys are optional.
 * Keys in `OmitK` are removed.
 *
 * @typeParam T - A DCC schema tuple.
 * @typeParam OmitK - Field names to omit from the result (e.g., "tls").
 */
type ArgsFromSchema<T extends Schema, OmitK extends string = never> =
  & {
    [K in Extract<RequiredKeysOf<T>, string> as K extends OmitK ? never : K]:
      WireKind<KindForKey<T, K>>;
  }
  & {
    [K in Exclude<Extract<OptionalKeysOf<T>, string>, OmitK>]?: WireKind<
      KindForKey<T, K>
    >;
  };

/**
 * Public argument type for a given DCC action.
 * Derived from {@link DCC_SCHEMA}. For "chat" and "schat", the `tls` field is omitted.
 *
 * @typeParam A - DCC action ("send" | "chat" | "schat" | "resume" | "accept").
 */
type DccArgsFor<A extends DccAction> = ArgsFromSchema<
  (typeof DCC_SCHEMA)[A],
  A extends "chat" | "schat" ? "tls" : never
>;

/**
 * Discriminated union for building and sending DCC commands.
 * - `send`: filename, ip, port, size, [token]
 * - `chat`: ip, port, [token]
 * - `schat`: ip, port, [token]  (secure; serialized as SCHAT)
 * - `resume`: filename, port, position, [token]
 * - `accept`: filename, port, position, [token]
 */
export type DccCmd =
  | { action: "send"; args: DccArgsFor<"send"> }
  | { action: "chat"; args: DccArgsFor<"chat"> }
  | { action: "schat"; args: DccArgsFor<"schat"> }
  | { action: "resume"; args: DccArgsFor<"resume"> }
  | { action: "accept"; args: DccArgsFor<"accept"> };

/** Create a typed DCC payload from a raw CTCP event. */
function createDcc(event: RawCtcpEvent | RawCtcpReplyEvent) {
  const { source, params: { arg } } = event;
  if (!source || !arg) return undefined;

  const raw = arg.trim();
  const firstSpace = raw.indexOf(" ");
  const verb = firstSpace === -1 ? raw : raw.slice(0, firstSpace);
  const action = (verb.toLowerCase() in DCC_SCHEMA)
    ? (verb.toLowerCase() as DccAction)
    : undefined;
  if (!action) return undefined;

  let idx = verb.length + 1;

  if (action === "send") {
    const t1 = nextToken(raw, idx); // filename
    const t2 = nextToken(raw, t1.next); // ip
    const t3 = nextToken(raw, t2.next); // port
    const t4 = nextToken(raw, t3.next); // size
    const t5 = nextToken(raw, t4.next); // token?
    if (!t1.tok || !t2.tok || !t3.tok || !t4.tok) return undefined;

    const portRaw = t3.tok;
    const sizeRaw = t4.tok;
    const tokenRaw = t5.tok;

    const ip = parseHost(t2.tok);
    if (!ip) return undefined;

    const passive = portRaw === "0" || isPassivePlaceholder(ip.value);
    const port = parsePort(portRaw, passive);
    const size = parseUint(sizeRaw);
    const token = parseToken(tokenRaw);

    if (port === undefined || size === undefined) return undefined;
    if (passive && token === undefined) return undefined;

    return {
      text: raw,
      action: "send",
      filename: t1.tok,
      ip,
      port,
      size,
      token,
      passive,
    } satisfies DccPayloadByAction["send"];
  }

  if (action === "chat" || action === "schat") {
    // Accept and ignore optional subtype "chat"
    const maybeType = nextToken(raw, idx); // "chat" or ip
    let ipTok = maybeType;
    if (maybeType.tok.toLowerCase() === "chat") {
      ipTok = nextToken(raw, maybeType.next);
    }

    const t2 = nextToken(raw, ipTok.next); // port
    const t3 = nextToken(raw, t2.next); // token?
    if (!ipTok.tok || !t2.tok) return undefined;

    const portRaw = t2.tok;
    const tokenRaw = t3.tok;

    const ip = parseHost(ipTok.tok);
    if (!ip) return undefined;

    const passive = portRaw === "0" || isPassivePlaceholder(ip.value);
    const port = parsePort(portRaw, passive);
    const token = parseToken(tokenRaw);

    if (port === undefined) return undefined;
    if (passive && token === undefined) return undefined;

    return {
      text: raw,
      action: "chat",
      ip,
      port,
      token,
      passive,
      tls: action === "schat",
    } satisfies DccPayloadByAction["chat"];
  }

  if (action === "resume" || action === "accept") {
    const t1 = nextToken(raw, idx); // filename
    const t2 = nextToken(raw, t1.next); // port
    const t3 = nextToken(raw, t2.next); // position
    const t4 = nextToken(raw, t3.next); // token?
    if (!t1.tok || !t2.tok || !t3.tok) return undefined;

    const portRaw = t2.tok;
    const posRaw = t3.tok;
    const tokenRaw = t4.tok;

    const passive = portRaw === "0"; // no IP here
    const port = parsePort(portRaw, passive);
    const position = parseUint(posRaw);
    const token = parseToken(tokenRaw);

    if (port === undefined || position === undefined) return undefined;
    if (passive && token === undefined) return undefined;

    const base = {
      text: raw,
      filename: t1.tok,
      port,
      position,
      token,
      passive,
    };

    return action === "resume"
      ? ({ action: "resume", ...base } as DccPayloadByAction["resume"])
      : ({ action: "accept", ...base } as DccPayloadByAction["accept"]);
  }

  return undefined;
}

/**
 * Parse an unsigned decimal integer.
 * Rules:
 * - digits only
 * - 0 to Number.MAX_SAFE_INTEGER
 * - if `max` is set, value must be <= max
 * Return undefined on failure.
 */
function parseUint(s: string, max?: number): number | undefined {
  if (!UINT_RE.test(s)) return undefined;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < 0) return undefined;
  if (max !== undefined && n > max) return undefined;
  return n;
}

/**
 * Parse port number.
 * Active: 1..65535.
 * Passive: accept any unsigned integer and normalize to 0.
 */
function parsePort(s: string, passive: boolean): number | undefined {
  const n = parseUint(s);
  if (n === undefined) return undefined;
  if (passive) return 0; // tolerate non-zero, normalize to 0
  return n >= 1 && n <= 65535 ? n : undefined;
}

/** Parse optional token as unsigned integer. */
function parseToken(s?: string): number | undefined {
  if (!s) return undefined;
  const n = parseUint(s);
  return n === undefined ? undefined : n;
}

/**
 * Detect placeholder IPs that indicate passive DCC.
 * Recognized:
 * - "0" decimal IPv4 zero
 * - "0.0.0.0" IPv4 unspecified
 * - "::" IPv6 unspecified
 */
function isPassivePlaceholder(ip: string): boolean {
  return ip === "0" || ip === "0.0.0.0" || ip === "::";
}

/**
 * Parse and normalize host strings.
 * Supports:
 * - decimal IPv4 (uint32)
 * - dotted IPv4
 * - bracketed or plain IPv6
 * - hostnames
 */
function parseHost(raw: string): HostValue | undefined {
  let s = raw.trim();
  if (!s) return undefined;

  // Decimal IPv4 (uint32 form)
  if (UINT_RE.test(s)) {
    const n = parseUint(s, 0xFFFF_FFFF);
    if (n !== undefined) {
      const a = (n >>> 24) & 255;
      const b = (n >>> 16) & 255;
      const c = (n >>> 8) & 255;
      const d = n & 255;
      return { type: "ipv4", value: `${a}.${b}.${c}.${d}` };
    }
  }

  // Strict dotted IPv4 (reject octets with leading zeros, except "0")
  const dottedMatch = IPV4_DOTTED_RE.exec(s);
  if (dottedMatch) {
    const octets = dottedMatch.slice(1);
    if (octets.some((o) => /^0\d+$/.test(o))) return undefined; // reject "08", "001"
    const [a, b, c, d] = octets.map(Number);
    if ([a, b, c, d].every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      return { type: "ipv4", value: `${a}.${b}.${c}.${d}` };
    }
    return undefined;
  }

  // IPv6 (allow [addr], strip zone-id %, normalize lowercase)
  if (s.includes(":") || (s.startsWith("[") && s.endsWith("]"))) {
    if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
    s = s.replace(/%[0-9A-Za-z.]+$/, ""); // remove scope-id, e.g., %eth0 or %12
    return { type: "ipv6", value: s.toLowerCase() };
  }

  // Hostname (normalize lowercase, accept FQDN with trailing dot)
  if (s.endsWith(".")) s = s.slice(0, -1);
  if (HOSTNAME_RE.test(s)) {
    return { type: "hostname", value: s.toLowerCase() };
  }

  return undefined;
}

/**
 * Tokenize the next space-delimited token starting at index i.
 * Supports quoted tokens with \" and \\ escapes.
 * If a token starts with a quote but never closes, the remainder of
 * the string is returned as the token, with next = s.length.
 */
function nextToken(s: string, i: number) {
  const n = s.length;

  // skip spaces
  while (i < n && s.charCodeAt(i) === 32) i++;
  if (i >= n) return { tok: "", next: n };

  // quoted token
  if (s.charCodeAt(i) === 34) {
    i++;
    let out = "";
    let j = i;
    let esc = false;

    while (j < n) {
      const ch = s[j];
      if (esc) {
        out += ch;
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        j++; // close
        break;
      } else {
        out += ch;
      }
      j++;
    }

    // no closing quote: return remainder as one token
    if (j >= n && (n === 0 || s[n - 1] !== '"')) return { tok: out, next: n };
    if (j < n && s.charCodeAt(j) === 32) j++;
    return { tok: out, next: j };
  }

  // unquoted token
  let j = s.indexOf(" ", i);
  if (j === -1) j = n;
  const tok = s.slice(i, j);
  if (j < n && s.charCodeAt(j) === 32) j++;
  return { tok, next: j };
}

function fmtFilename(s: string): string {
  if (FILENAME_NEEDS_QUOTE.test(s)) {
    return `"${s.replace(FILENAME_ESCAPE_CHARS, "\\$1")}"`;
  }
  return s;
}

function fmtHost(ip: string): string {
  const h = parseHost(ip);
  if (!h) return ip;

  switch (h.type) {
    case "ipv6":
      return `[${h.value}]`;

    case "hostname":
      return h.value;

    case "ipv4": {
      if (h.value === "0.0.0.0") return "0"; // passive placeholder
      const [a, b, c, d] = h.value.split(".").map(Number);
      const n = (((a << 24) >>> 0) + (b << 16) + (c << 8) + d) >>> 0;
      return String(n);
    }
  }
}

/** Public surface of this plugin. */
interface DccFeatures {
  commands: {
    /**
     * Send a DCC command to a target user.
     *
     * Wraps the CTCP `DCC` command and returns the raw IRC line
     * that is sent over the wire.
     *
     * @param target - Nickname of the recipient user.
     * @param cmd - DCC command object (e.g., `send`, `chat`, `resume`).
     * @returns The raw IRC `PRIVMSG` line containing the DCC command.
     *
     * @example
     * ```ts
     * client.commands.dcc("Nick", {
     *   action: "chat",
     *   args: { ip: { type: "ipv4", value: "203.0.113.42" }, port: 6000 }
     * });
     * // -> PRIVMSG Nick :\x01DCC CHAT 203.0.113.42 6000\x01
     * ```
     */
    dcc(target: string, cmd: DccCmd): string;
  };
  events: DccEventMap;
  utils: {
    /** DCC helpers. */
    dcc: {
      createDcc: typeof createDcc;
      parseUint: typeof parseUint;
      parsePort: typeof parsePort;
      parseToken: typeof parseToken;
      isPassivePlaceholder: typeof isPassivePlaceholder;
      parseHost: typeof parseHost;
      nextToken: typeof nextToken;
    };
  };
}

export default createPlugin("dcc", [ctcp])<DccFeatures>((client) => {
  /** Emit a typed DCC event with its payload. */
  const emit = <A extends DccAction>(
    a: A,
    p: Message<DccPayloadByAction[A]>,
  ) => {
    (client.emit as <K extends keyof DccEventMap>(
      k: K,
      v: DccEventMap[K],
    ) => void)(
      `dcc_${a}` as Extract<keyof DccEventMap, `dcc_${A}`>,
      p as DccEventMap[Extract<keyof DccEventMap, `dcc_${A}`>],
    );
  };

  client.dcc = (target: string, cmd: DccCmd): string => {
    let msg: string;

    switch (cmd.action) {
      case "send": {
        const a = cmd.args;
        msg = [
          "SEND",
          fmtFilename(a.filename),
          fmtHost(a.ip),
          String(a.port),
          String(a.size),
          ...(a.token !== undefined ? [String(a.token)] : []),
        ].join(" ");
        break;
      }
      case "chat": {
        const a = cmd.args;
        msg = [
          "CHAT",
          fmtHost(a.ip),
          String(a.port),
          ...(a.token !== undefined ? [String(a.token)] : []),
        ].join(" ");
        break;
      }
      case "schat": {
        const a = cmd.args;
        msg = [
          "SCHAT",
          fmtHost(a.ip),
          String(a.port),
          ...(a.token !== undefined ? [String(a.token)] : []),
        ].join(" ");
        break;
      }
      case "resume": {
        const a = cmd.args;
        msg = [
          "RESUME",
          fmtFilename(a.filename),
          String(a.port),
          String(a.position),
          ...(a.token !== undefined ? [String(a.token)] : []),
        ].join(" ");
        break;
      }
      case "accept": {
        const a = cmd.args;
        msg = [
          "ACCEPT",
          fmtFilename(a.filename),
          String(a.port),
          String(a.position),
          ...(a.token !== undefined ? [String(a.token)] : []),
        ].join(" ");
        break;
      }
    }

    client.ctcp(target, "DCC", msg);
    return `PRIVMSG ${target} :\x01DCC ${msg}\x01`;
  };

  // Bridge CTCP DCC raw events to typed DCC events.
  client.on(["raw_ctcp:dcc"], (msg) => {
    const dcc = client.utils.dcc.createDcc(msg);
    if (!dcc) return;
    emit(dcc.action, { ...msg, params: dcc });
  });

  client.utils.dcc = {
    createDcc,
    parseUint,
    parsePort,
    parseToken,
    isPassivePlaceholder,
    parseHost,
    nextToken,
  };
});
