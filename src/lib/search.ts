export interface SearchItem {
  slug: string
  name: string
  aliases: string[]
  category: string
}

export interface SearchOptions {
  category?: string
  limit?: number
}

export function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
}

export function boundedEditDistance(left: string, right: string, limit: number): number | null {
  if (Math.abs(left.length - right.length) > limit) return null
  if (left === right) return 0
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    let rowMinimum = current[0]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      const value = Math.min(previous[rightIndex] + 1, current[rightIndex - 1] + 1, substitution)
      current.push(value)
      rowMinimum = Math.min(rowMinimum, value)
    }
    if (rowMinimum > limit) return null
    previous = current
  }
  return previous[right.length] <= limit ? previous[right.length] : null
}

function fuzzyLimit(length: number): number {
  if (length < 4) return 0
  if (length < 7) return 1
  return 2
}

function compareText(left: string, right: string): number {
  if (left === right) return 0
  return left < right ? -1 : 1
}

function scoreItem(item: SearchItem, normalizedQuery: string): number | null {
  const name = normalizeSearchTerm(item.name)
  const aliases = item.aliases.map(normalizeSearchTerm)
  if (name === normalizedQuery) return 0
  if (aliases.includes(normalizedQuery)) return 100

  const values = [name, ...aliases]
  if (values.some((value) => value.startsWith(normalizedQuery))) return 200
  if (values.some((value) => value.includes(normalizedQuery))) return 300

  const limit = fuzzyLimit(normalizedQuery.length)
  if (limit === 0) return null
  let closest = Number.POSITIVE_INFINITY
  for (const value of values) {
    const distance = boundedEditDistance(normalizedQuery, value, limit)
    if (distance !== null) closest = Math.min(closest, distance)
  }
  return Number.isFinite(closest) ? 400 + closest : null
}

export function searchCatalog(
  items: readonly SearchItem[],
  query: string,
  options: SearchOptions = {}
): SearchItem[] {
  const slugs = new Set<string>()
  for (const item of items) {
    if (slugs.has(item.slug)) throw new Error(`Duplicate search slug: ${item.slug}`)
    slugs.add(item.slug)
  }

  const normalizedQuery = normalizeSearchTerm(query)
  const category = options.category || ''
  const candidates = items.filter((item) => !category || item.category === category)
  const ranked = candidates
    .map((item) => ({ item, score: normalizedQuery ? scoreItem(item, normalizedQuery) : 0 }))
    .filter((entry): entry is { item: SearchItem; score: number } => entry.score !== null)
    .sort(
      (left, right) =>
        left.score - right.score ||
        compareText(normalizeSearchTerm(left.item.name), normalizeSearchTerm(right.item.name)) ||
        compareText(left.item.slug, right.item.slug)
    )
  return ranked.slice(0, options.limit ?? ranked.length).map((entry) => entry.item)
}
