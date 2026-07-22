import { searchCatalog, type SearchItem } from '@/lib/search'

const PAGE_SIZE = 24
const input = document.querySelector<HTMLInputElement>('#catalog-search')
const count = document.querySelector<HTMLElement>('#result-count')
const grid = document.querySelector<HTMLElement>('#logo-grid')
const empty = document.querySelector<HTMLElement>('#empty-state')
const showMore = document.querySelector<HTMLButtonElement>('#show-more')
const filters = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-category]'))
const cards = new Map(
  Array.from(document.querySelectorAll<HTMLElement>('[data-logo-card]')).map((card) => [
    card.dataset.slug || '',
    card,
  ])
)

let index: SearchItem[] = []
let category = ''
let visibleLimit = PAGE_SIZE

function render(): void {
  if (!input || !count || !grid || !empty || !showMore) return
  const results = searchCatalog(index, input.value, { category })
  const resultSlugs = new Set(results.map((item) => item.slug))
  for (const [slug, card] of cards) card.hidden = !resultSlugs.has(slug)
  results.forEach((item, position) => {
    const card = cards.get(item.slug)
    if (!card) return
    grid.append(card)
    card.hidden = position >= visibleLimit
  })
  count.textContent = `${results.length} ${results.length === 1 ? 'logo' : 'logos'}`
  empty.hidden = results.length > 0 || index.length === 0
  showMore.hidden = results.length <= visibleLimit
}

function readSearchIndex(): SearchItem[] {
  const element = document.querySelector<HTMLScriptElement>('#search-index')
  if (!element?.textContent) throw new Error('Search index is unavailable')
  const parsed: unknown = JSON.parse(element.textContent)
  if (!Array.isArray(parsed)) throw new Error('Search index is invalid')
  return parsed as SearchItem[]
}

function start(): void {
  if (!input) return
  index = readSearchIndex()
  render()
  input.addEventListener('input', () => {
    visibleLimit = PAGE_SIZE
    render()
  })
  for (const filter of filters) {
    filter.addEventListener('click', () => {
      category = filter.dataset.category || ''
      visibleLimit = PAGE_SIZE
      for (const candidate of filters) {
        const active = candidate === filter
        candidate.classList.toggle('is-active', active)
        candidate.setAttribute('aria-pressed', String(active))
      }
      render()
    })
  }
  showMore?.addEventListener('click', () => {
    visibleLimit += PAGE_SIZE
    render()
  })
}

try {
  start()
} catch {
  if (count) count.textContent = 'Search unavailable'
}
