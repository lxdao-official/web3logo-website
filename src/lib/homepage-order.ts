export const HOMEPAGE_FEATURED_SLUGS = ['lxdao', 'ethpanda'] as const

export function orderHomepageLogos<T extends { slug: string }>(logos: readonly T[]): T[] {
  const priority = new Map<string, number>(HOMEPAGE_FEATURED_SLUGS.map((slug, index) => [slug, index]))
  return [...logos].sort((left, right) => (priority.get(left.slug) ?? Infinity) - (priority.get(right.slug) ?? Infinity))
}
