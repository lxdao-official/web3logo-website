import { describe, expect, it } from 'vitest'
import { boundedEditDistance, normalizeSearchTerm, searchCatalog, type SearchItem } from './search'

const catalog: SearchItem[] = [
  { slug: 'ethpanda', name: 'ETHPanda', aliases: ['ETH Panda'], category: 'DAO' },
  { slug: 'ethereum', name: 'Ethereum', aliases: ['ETH'], category: 'Public Chain' },
  { slug: 'bi-shi', name: '比特币', aliases: ['Bitcoin'], category: 'Public Chain' },
]

describe('normalizeSearchTerm', () => {
  it('normalizes compatibility characters, case, diacritics, punctuation, and whitespace', () => {
    expect(normalizeSearchTerm('  ÉＴＨ-Pand.a  ')).toBe('ethpanda')
  })

  it('preserves Chinese characters', () => {
    expect(normalizeSearchTerm('比 特币')).toBe('比特币')
  })
})

describe('searchCatalog', () => {
  it.each(['ethpanda', 'ETH Panda', 'eth-pand-a', 'ethpand'])(
    'resolves %s to ETHPanda',
    (query) => {
      expect(searchCatalog(catalog, query)[0]?.name).toBe('ETHPanda')
    }
  )

  it('returns deterministic catalog order for an empty query', () => {
    expect(searchCatalog(catalog, '').map((item) => item.slug)).toEqual([
      'ethereum',
      'ethpanda',
      'bi-shi',
    ])
  })

  it('uses presentation priority before alphabetical order when ranks tie', () => {
    const prioritized: SearchItem[] = [
      { slug: 'aave', name: 'Aave', aliases: [], category: 'DeFi' },
      { slug: 'ethpanda', name: 'ETHPanda', aliases: [], category: 'DAO', priority: 1 },
      { slug: 'lxdao', name: 'LXDAO', aliases: [], category: 'DAO', priority: 0 },
    ]
    expect(searchCatalog(prioritized, '').map((item) => item.slug)).toEqual(['lxdao', 'ethpanda', 'aave'])
  })

  it('finds Chinese names', () => {
    expect(searchCatalog(catalog, '比特币')[0]?.slug).toBe('bi-shi')
  })

  it('applies category filters before ranking', () => {
    expect(searchCatalog(catalog, 'eth', { category: 'DAO' }).map((item) => item.slug)).toEqual([
      'ethpanda',
    ])
  })

  it('rejects duplicate slugs', () => {
    expect(() => searchCatalog([...catalog, catalog[0]!], 'eth')).toThrow(/Duplicate search slug/)
  })

  it('does not match typos outside the bounded limit', () => {
    expect(searchCatalog(catalog, 'exxpandzzz')).toEqual([])
  })
})

describe('boundedEditDistance', () => {
  it('stops beyond the supplied limit', () => {
    expect(boundedEditDistance('ethpand', 'ethpanda', 2)).toBe(1)
    expect(boundedEditDistance('eth', 'ethereum', 2)).toBeNull()
  })
})
