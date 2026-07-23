import catalogData from '@/data/logos.json'

export const CATEGORIES = [
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
] as const

export type Category = (typeof CATEGORIES)[number]

export interface LogoAsset {
  legacyId: number
  name: string
  format: 'svg' | 'png' | 'jpg' | 'webp'
  mediaType: 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/webp'
  path: string
  sha256: string
  bytes: number
  sourceUrl: string
}

export interface Logo {
  legacyId: number
  name: string
  slug: string
  category: Category
  website: string | null
  aliases: string[]
  license: string
  verification: string
  assets: LogoAsset[]
}

export const logos = catalogData.logos as Logo[]

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function relatedLogos(current: Logo, limit = 4): Logo[] {
  return logos
    .filter((logo) => logo.slug !== current.slug && logo.category === current.category)
    .sort((left, right) => left.slug.localeCompare(right.slug, 'en'))
    .slice(0, limit)
}
