#!/usr/bin/env node

import { lstat, readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALLOWED_FORMATS,
  MAX_ASSET_BYTES,
  identifyFormat,
  sha256,
  svgSafetyErrors,
} from './asset-safety.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

async function listFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else if (entry.isFile() || entry.isSymbolicLink()) files.push(path)
  }
  return files
}

export async function validateAssets(logos, repositoryRoot = root) {
  const errors = []
  let count = 0
  const publicRoot = resolve(repositoryRoot, 'public') + sep
  const assetRoot = resolve(repositoryRoot, 'public', 'logos')
  const referencedFiles = new Set()
  for (const logo of logos) {
    for (const asset of logo.assets) {
      count += 1
      if (!ALLOWED_FORMATS.has(asset.format)) {
        errors.push(`${logo.slug}: unsupported declared format ${asset.format}`)
        continue
      }
      if (!asset.path.startsWith('/logos/') || asset.path.includes('..')) {
        errors.push(`${logo.slug}: unsafe asset path`)
        continue
      }
      const filename = resolve(repositoryRoot, 'public', asset.path.slice(1))
      if (!filename.startsWith(publicRoot)) {
        errors.push(`${logo.slug}: asset path escapes public directory`)
        continue
      }
      referencedFiles.add(filename)
      try {
        if ((await lstat(filename)).isSymbolicLink()) {
          errors.push(`${logo.slug}: asset file must not be a symbolic link`)
          continue
        }
      } catch {
        errors.push(`${logo.slug}: asset file is missing`)
        continue
      }
      let bytes
      try {
        bytes = await readFile(filename)
      } catch {
        errors.push(`${logo.slug}: asset file is missing`)
        continue
      }
      if (bytes.length === 0 || bytes.length > MAX_ASSET_BYTES) {
        errors.push(`${logo.slug}: asset size is outside the allowed range`)
      }
      if (bytes.length !== asset.bytes) {
        errors.push(`${logo.slug}: asset byte count does not match metadata`)
      }
      const detected = identifyFormat(bytes)
      if (detected !== asset.format) {
        errors.push(`${logo.slug}: detected format does not match metadata`)
      }
      if (sha256(bytes) !== asset.sha256) {
        errors.push(`${logo.slug}: asset hash does not match metadata`)
      }
      if (detected === 'svg') {
        for (const error of svgSafetyErrors(bytes)) {
          errors.push(`${logo.slug}: SVG ${error}`)
        }
      }
    }
  }
  try {
    for (const filename of await listFiles(assetRoot)) {
      if (!referencedFiles.has(filename)) {
        errors.push(`unreferenced asset file: ${relative(assetRoot, filename)}`)
      }
    }
  } catch {
    if (referencedFiles.size > 0) errors.push('public/logos asset directory is missing')
  }
  return { count, errors }
}

async function main() {
  const catalog = JSON.parse(await readFile(resolve(root, 'src/data/logos.json'), 'utf8'))
  const result = await validateAssets(catalog.logos)
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(error)
    process.exitCode = 1
    return
  }
  console.log(`Validated ${result.count} assets.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
