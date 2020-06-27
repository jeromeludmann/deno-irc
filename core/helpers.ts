export function isChannel(target: string): boolean {
  return ["#", "&", "!", "+"].some((prefix) => target.startsWith(prefix));
}

export function isNick(target: string): boolean {
  return !isChannel(target);
}

export function isUserMask(prefix: string): boolean {
  return /^(.+)!(.+)@(.+)$/.test(prefix);
}

export function isServerHost(prefix: string): boolean {
  return !isUserMask(prefix);
}
