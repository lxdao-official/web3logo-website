#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudflareLegacyRedirectLine } from './legacy-redirects.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = resolve(root, 'dist')
const catalog = JSON.parse(await readFile(resolve(root, 'src/data/logos.json'), 'utf8'))

async function requireFile(path) {
  try {
    await access(resolve(dist, path))
  } catch {
    throw new Error(`build output is missing ${path}`)
  }
}

await Promise.all([
  requireFile('index.html'),
  requireFile('404.html'),
  requireFile('legacy-unavailable/index.html'),
  requireFile('submit/index.html'),
  requireFile('search-index.json'),
  requireFile('_headers'),
  requireFile('_redirects'),
  requireFile('robots.txt'),
  requireFile('sitemap-index.xml'),
  ...catalog.logos.map((logo) => requireFile(`logos/${logo.slug}/index.html`)),
  ...catalog.logos.flatMap((logo) =>
    logo.assets.map((asset) => requireFile(asset.path.replace(/^\//, '')))
  ),
])

const indexHtml = await readFile(resolve(dist, 'index.html'), 'utf8')
const inlineSearchMatch = indexHtml.match(
  /<script id="search-index" type="application\/json">([\s\S]*?)<\/script>/
)
if (!inlineSearchMatch) throw new Error('homepage is missing the inline local search index')
const inlineSearchIndex = JSON.parse(inlineSearchMatch[1])
if (!Array.isArray(inlineSearchIndex) || inlineSearchIndex.length !== catalog.logos.length) {
  throw new Error('inline local search index does not match the catalog')
}
const executableScripts = [...indexHtml.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script>/g)].filter(
  (match) => !/type="application\/json"/.test(match[1])
)
if (executableScripts.some((match) => !/\bsrc=/.test(match[1]))) {
  throw new Error('homepage contains executable inline JavaScript blocked by the production CSP')
}
if (!executableScripts.some((match) => /src="\/_astro\/.+\.js"/.test(match[1]))) {
  throw new Error('homepage is missing the external search client')
}

const headers = await readFile(resolve(dist, '_headers'), 'utf8')
for (const requiredHeader of [
  "Content-Security-Policy: default-src 'self'",
  'Strict-Transport-Security: max-age=31536000',
  'X-Content-Type-Options: nosniff',
  '/logos/*',
  'Cache-Control: public, max-age=86400, must-revalidate',
]) {
  if (!headers.includes(requiredHeader)) {
    throw new Error(`static headers are missing required policy: ${requiredHeader}`)
  }
}
if (/\/logos\/\*[\s\S]*?Cache-Control:[^\n]*immutable/.test(headers)) {
  throw new Error('mutable logo asset paths must not use immutable caching')
}

const headerBlocks = new Map()
let currentHeaderPath = null
for (const line of headers.split('\n')) {
  if (line && !/^\s/.test(line)) {
    currentHeaderPath = line.trim()
    headerBlocks.set(currentHeaderPath, [])
  } else if (currentHeaderPath && line.trim()) {
    headerBlocks.get(currentHeaderPath).push(line.trim())
  }
}
const logoHeaders = headerBlocks.get('/logos/*') ?? []
if (logoHeaders.some((line) => line.startsWith('Content-Security-Policy:'))) {
  throw new Error('logo detail pages must not receive the sandboxed asset CSP')
}
const svgHeaders = headerBlocks.get('/logos/*.svg') ?? []
if (!svgHeaders.some((line) => line.includes("default-src 'none'") && line.includes('sandbox'))) {
  throw new Error('SVG logo assets are missing the sandboxed CSP')
}

const sitemapIndex = await readFile(resolve(dist, 'sitemap-index.xml'), 'utf8')
if (!sitemapIndex.includes('https://web3logo.lxdao.io/sitemap-0.xml')) {
  throw new Error('sitemap index does not use the canonical production origin')
}
const sitemap = await readFile(resolve(dist, 'sitemap-0.xml'), 'utf8')
for (const logo of catalog.logos) {
  if (!sitemap.includes(`https://web3logo.lxdao.io/logos/${logo.slug}/`)) {
    throw new Error(`sitemap is missing ${logo.slug}`)
  }
}

const redirects = await readFile(resolve(dist, '_redirects'), 'utf8')
let idMap = { logos: [] }
try {
  idMap = JSON.parse(await readFile(resolve(root, 'migration/legacy-id-map.json'), 'utf8'))
} catch (error) {
  if (catalog.logos.length > 0) throw error
}
const redirectRules = redirects
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
const firstDynamicRedirect = redirectRules.findIndex((line) => line.split(/\s+/)[0].includes('*'))
if (
  firstDynamicRedirect !== -1 &&
  redirectRules
    .slice(firstDynamicRedirect)
    .some((line) => !line.split(/\s+/)[0].includes('*'))
) {
  throw new Error('Cloudflare Pages static redirects must precede dynamic redirects')
}
for (const logo of idMap.logos) {
  if (!redirects.includes(cloudflareLegacyRedirectLine(logo))) {
    throw new Error(`legacy redirect is missing for ID ${logo.legacyId}`)
  }
}

console.log(`Validated static build for ${catalog.logos.length} logos.`)
