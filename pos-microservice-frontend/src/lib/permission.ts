// simple helper: tokenPerms from user (string[])
export function hasPermission(tokenPerms: string[] | undefined | null, required?: string | string[] | undefined) {
  if (!required) return true // no requirement => allow
  if (!tokenPerms || tokenPerms.length === 0) return false

  const reqs = Array.isArray(required) ? required : [required]

  // you may want ALL required or ANY required; choose ANY by default
  // change to .every(...) if you want all required
  return reqs.some(r => {
    // support wildcard suffix like 'inventory.*'
    if (r.endsWith('*')) {
      const base = r.slice(0, -1)
      return tokenPerms.some(p => p.startsWith(base))
    }
    return tokenPerms.includes(r)
  })
}
