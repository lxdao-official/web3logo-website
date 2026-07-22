#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { validateAssets } from './validate-assets.mjs'
import { assetExclusionSchema } from './exclusion-reasons.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const categories = [
  'DeFi',
  'NFTs',
  'DID',
  'Wallet',
  'Plugin',
  'DAO',
  'SocialFi',
  'GameFi',
  'Public Chain',
  'Other',
]

const httpsUrl = z.url().refine((value) => value.startsWith('https://'), 'must use HTTPS')
const assetSchema = z.object({
  legacyId: z.number().int().nonnegative(),
  name: z.string().trim().min(1).max(160),
  format: z.enum(['svg', 'png', 'jpg', 'webp']),
  mediaType: z.enum(['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']),
  path: z.string().regex(/^\/logos\/[a-z0-9-]+\/[0-9]+\.(svg|png|jpg|webp)$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().positive().max(5 * 1024 * 1024),
  sourceUrl: httpsUrl,
})
const logoSchema = z.object({
  legacyId: z.number().int().nonnegative(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(categories),
  website: httpsUrl.nullable(),
  aliases: z.array(z.string().trim().min(1).max(120)).max(20),
  license: z.string().trim().min(1).max(500),
  verification: z.string().trim().min(1).max(500),
  assets: z.array(assetSchema).min(1),
})
const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  logos: z.array(logoSchema),
})
const exclusionsSchema = z.object({
  schemaVersion: z.literal(1),
  assets: z.array(assetExclusionSchema),
  metadata: z.array(
    z.object({
      legacyLogoId: z.number().int().nonnegative(),
      field: z.literal('website'),
      sourceValue: z.string().min(1),
      reason: z.literal('non-https-url-omitted'),
    })
  ),
  logos: z.array(
    z.object({
      legacyLogoId: z.number().int().nonnegative(),
      name: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      reason: z.literal('no-publishable-assets'),
    })
  ),
})

function duplicates(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item)) return true
    seen.add(item)
    return false
  })
}

function sameMembers(left, right) {
  return left.length === right.size && left.every((item) => right.has(item))
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  const source = await readFile(resolve(root, 'src/data/logos.json'), 'utf8')
  const parsed = catalogSchema.safeParse(JSON.parse(source))
  if (!parsed.success) {
    console.error(z.prettifyError(parsed.error))
    process.exitCode = 1
    return
  }

  const { logos } = parsed.data
  const errors = []
  const duplicateSlugs = duplicates(logos.map((logo) => logo.slug))
  const duplicateIds = duplicates(logos.map((logo) => logo.legacyId))
  const assetIds = logos.flatMap((logo) => logo.assets.map((asset) => asset.legacyId))
  if (duplicateSlugs.length) errors.push('duplicate logo slugs found')
  if (duplicateIds.length) errors.push('duplicate legacy logo IDs found')
  if (duplicates(assetIds).length) errors.push('duplicate legacy asset IDs found')
  for (const logo of logos) {
    if (logo.assets.some((asset) => !asset.path.startsWith(`/logos/${logo.slug}/`))) {
      errors.push(`${logo.slug}: asset path does not match logo slug`)
    }
    if (duplicates([logo.name, ...logo.aliases].map((value) => value.normalize('NFKC').toLocaleLowerCase('und'))).length) {
      errors.push(`${logo.slug}: duplicate name or alias`)
    }
  }

  const hasExport = await exists(resolve(root, 'migration/legacy-active-export.json'))
  const hasMap = await exists(resolve(root, 'migration/legacy-id-map.json'))
  const hasExclusions = await exists(resolve(root, 'migration/legacy-exclusions.json'))
  if (logos.length > 0 && (!hasExport || !hasMap || !hasExclusions)) {
    errors.push('non-empty catalog requires the raw legacy export, ID map, and exclusions ledger')
  }
  if (logos.length === 0 && !(await exists(resolve(root, 'migration/BLOCKED.md')))) {
    errors.push('empty catalog requires an explicit migration blocker')
  }
  let legacyMapping = { logos: [] }
  if (hasMap) {
    legacyMapping = JSON.parse(await readFile(resolve(root, 'migration/legacy-id-map.json'), 'utf8'))
    if (
      !legacyMapping ||
      typeof legacyMapping !== 'object' ||
      legacyMapping.schemaVersion !== 1 ||
      !Array.isArray(legacyMapping.logos)
    ) {
      errors.push('legacy ID map must contain a versioned logos array')
    }
  }
  if (hasExport && hasExclusions) {
    const raw = JSON.parse(await readFile(resolve(root, 'migration/legacy-active-export.json'), 'utf8'))
    const exclusionsResult = exclusionsSchema.safeParse(
      JSON.parse(await readFile(resolve(root, 'migration/legacy-exclusions.json'), 'utf8'))
    )
    if (!Array.isArray(raw.data) || !raw.data.every((item) => item && Array.isArray(item.logo))) {
      errors.push('raw legacy export does not contain the expected active data rows')
    } else if (!exclusionsResult.success) {
      errors.push(`invalid exclusions ledger: ${z.prettifyError(exclusionsResult.error)}`)
    } else {
      const exclusions = exclusionsResult.data
      const sourceLogoIds = raw.data.map((item) => item.id)
      const sourceAssetIds = raw.data.flatMap((item) => item.logo.map((asset) => asset.id))
      const publishedLogoIds = logos.map((logo) => logo.legacyId)
      const publishedAssetIds = logos.flatMap((logo) => logo.assets.map((asset) => asset.legacyId))
      const excludedLogoIds = exclusions.logos.map((item) => item.legacyLogoId)
      const excludedAssetIds = exclusions.assets.map((item) => item.legacyAssetId)
      if (
        duplicates(sourceLogoIds).length ||
        duplicates(sourceAssetIds).length ||
        duplicates([...publishedLogoIds, ...excludedLogoIds]).length ||
        duplicates([...publishedAssetIds, ...excludedAssetIds]).length
      ) {
        errors.push('legacy reconciliation contains duplicate source, published, or excluded IDs')
      }
      if (!sameMembers(sourceLogoIds, new Set([...publishedLogoIds, ...excludedLogoIds]))) {
        errors.push('published and excluded logo IDs do not reconcile with the raw export')
      }
      if (!sameMembers(sourceAssetIds, new Set([...publishedAssetIds, ...excludedAssetIds]))) {
        errors.push('published and excluded asset IDs do not reconcile with the raw export')
      }
      const mapEntries = Array.isArray(legacyMapping?.logos) ? legacyMapping.logos : []
      const validMapEntries = mapEntries.every(
        (item) =>
          item &&
          Number.isInteger(item.legacyId) &&
          typeof item.slug === 'string' &&
          typeof item.legacyPath === 'string' &&
          /^\/detail\/[^\s]+\/\d+$/.test(item.legacyPath) &&
          (item.status === 'published' || item.status === 'excluded') &&
          typeof item.targetPath === 'string' &&
          /^\/[^\s]*$/.test(item.targetPath)
      )
      if (!validMapEntries) {
        errors.push('legacy ID map contains an invalid entry')
      } else {
        const mappedIds = mapEntries.map((item) => item.legacyId)
        if (duplicates(mappedIds).length || !sameMembers(sourceLogoIds, new Set(mappedIds))) {
          errors.push('legacy ID map does not cover every source logo exactly once')
        }
        const publishedById = new Map(logos.map((logo) => [logo.legacyId, logo]))
        const excludedIdSet = new Set(excludedLogoIds)
        for (const item of mapEntries) {
          const published = publishedById.get(item.legacyId)
          if (
            published &&
            (item.status !== 'published' ||
              item.slug !== published.slug ||
              item.targetPath !== `/logos/${published.slug}/`)
          ) {
            errors.push(`legacy ID map has an invalid published target for ID ${item.legacyId}`)
          }
          if (
            excludedIdSet.has(item.legacyId) &&
            (item.status !== 'excluded' || item.targetPath !== '/legacy-unavailable/')
          ) {
            errors.push(`legacy ID map has an invalid excluded target for ID ${item.legacyId}`)
          }
        }
      }
      const sourceLogoIdSet = new Set(sourceLogoIds)
      if (exclusions.metadata.some((item) => !sourceLogoIdSet.has(item.legacyLogoId))) {
        errors.push('metadata exclusion references an unknown source logo')
      }
    }
  }

  const assets = await validateAssets(logos)
  errors.push(...assets.errors)
  if (errors.length) {
    for (const error of errors) console.error(error)
    process.exitCode = 1
    return
  }
  console.log(`Validated ${logos.length} logos and ${assets.count} assets.`)
}

await main()
