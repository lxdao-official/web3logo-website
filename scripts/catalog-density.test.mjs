import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8')

function rule(selector) {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] ?? ''
}

describe('catalog density', () => {
  it('uses compact five-column cards on desktop', () => {
    expect(rule('.catalog .logo-grid')).toContain('grid-template-columns: repeat(5, minmax(0, 1fr));')
    expect(rule('.catalog .logo-card')).toContain('padding: 10px;')
    expect(rule('.catalog .logo-card__preview')).toContain('aspect-ratio: 5 / 3;')
  })

  it('keeps the catalog usable on narrow screens', () => {
    expect(css).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.catalog \.logo-grid\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 680px\)[\s\S]*?\.catalog \.logo-grid\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  })
})
