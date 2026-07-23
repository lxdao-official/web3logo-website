export function cloudflareLegacyRedirectSource({ legacyId, legacyPath }) {
  // Cloudflare Pages decodes encoded parentheses before matching static redirect
  // sources, so paths containing %28/%29 do not match literally. Keep the
  // stable legacy ID exact and use one dynamic segment for those 22 names.
  if (/%2[89]/i.test(legacyPath)) {
    return `/detail/*/${legacyId}`
  }
  return legacyPath
}

export function cloudflareLegacyRedirectLine(entry) {
  return `${cloudflareLegacyRedirectSource(entry)} ${entry.targetPath} 301`
}
