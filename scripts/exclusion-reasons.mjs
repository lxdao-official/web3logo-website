import { z } from 'zod'

export const ASSET_EXCLUSION_REASONS = [
  'unsupported-format',
  'unsafe-svg',
  'unsafe-url',
  'download-failed',
  'oversized-asset',
]

export const assetExclusionSchema = z.object({
  legacyLogoId: z.number().int().nonnegative(),
  legacyAssetId: z.number().int().nonnegative(),
  // Unsafe values must remain auditable even when they are not valid URLs.
  sourceUrl: z.string().max(8192),
  reason: z.enum(ASSET_EXCLUSION_REASONS),
  details: z.string().optional(),
})
