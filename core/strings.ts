/** Checks if the given string is a channel. */
export function isChannel(target: string): boolean {
  return ["#", "&", "!", "+"].some((prefix) => target.startsWith(prefix));
}
