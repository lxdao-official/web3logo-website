import { createHash } from 'node:crypto'

export const MAX_ASSET_BYTES = 5 * 1024 * 1024
export const ALLOWED_FORMATS = new Set(['svg', 'png', 'jpg', 'webp'])

export function identifyFormat(bytes) {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return 'png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg'
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  const probe = bytes
    .subarray(0, 4096)
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart()
  if (/^(?:<\?xml[^>]*>\s*)?(?:<!--.*?-->\s*)*<svg(?:\s|\/?>)/is.test(probe)) {
    return 'svg'
  }
  return null
}

export function svgSafetyErrors(bytes) {
  const source = bytes.toString('utf8').replace(/^\uFEFF/, '')
  const errors = []
  if (Buffer.from(source, 'utf8').length !== bytes.length) {
    errors.push('is not valid UTF-8')
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    errors.push('contains a doctype or entity declaration')
  }
  if (/<\?xml-stylesheet\b/i.test(source)) {
    errors.push('contains an external stylesheet instruction')
  }
  if (/<\s*(?:[\w.-]+:)?(script|foreignObject|iframe|object|embed)\b/i.test(source)) {
    errors.push('contains a forbidden element')
  }
  if (/\s(?:[\w.-]+:)?on[a-z][\w.-]*\s*=/i.test(source)) {
    errors.push('contains an event handler')
  }
  if (/(?:javascript|vbscript)\s*:/i.test(source.replace(/[\u0000-\u0020]/g, ''))) {
    errors.push('contains an executable URL')
  }
  const referencePattern = /\s(?:href|xlink:href|src)\s*=\s*(['"])(.*?)\1/gis
  for (const match of source.matchAll(referencePattern)) {
    if (match[2] && !match[2].trim().startsWith('#')) {
      errors.push('contains an external reference')
      break
    }
  }
  const cssUrls = [...source.matchAll(/url\s*\(([^)]*)\)/gis)].map((match) =>
    match[1].trim().replace(/^(['"])(.*)\1$/, '$2').trim()
  )
  if (
    /@import|expression\s*\(|-moz-binding/i.test(source) ||
    cssUrls.some((value) => value && !value.startsWith('#'))
  ) {
    errors.push('contains an external CSS reference')
  }
  if (!/<svg(?:\s|>)/i.test(source)) {
    errors.push('has no SVG root element')
  }
  return [...new Set(errors)]
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}
