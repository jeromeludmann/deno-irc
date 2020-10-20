/** Checks if the given string is a channel. */
export function isChannel(target: string): boolean {
  return ["#", "&", "!", "+"].some((prefix) => target.startsWith(prefix));
}

/** Checks if the given string is a nickname. */
export function isNick(target: string): boolean {
  return !isChannel(target);
}

/** Checks if the given string is a user mask. */
export function isUserMask(prefix: string): boolean {
  return /^(.+)!(.+)@(.+)$/.test(prefix);
}

/** Checks if the given string is a server hostname. */
export function isServerHost(prefix: string): boolean {
  return !isUserMask(prefix);
}
