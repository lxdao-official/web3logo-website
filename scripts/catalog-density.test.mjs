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

  it('keeps catalog preview slots uniform despite source image aspect ratios', () => {
    const preview = rule('.catalog .logo-card__preview')
    expect(preview).toContain('aspect-ratio: 5 / 3;')
    expect(preview).toContain('contain: size;')
  })

  it('contains every source logo without cropping it', () => {
    const preview = rule('.catalog .logo-card__preview')
    const image = rule('.catalog .logo-card__preview img')
    expect(preview).not.toContain('overflow: hidden;')
    expect(image).toContain('width: 88%;')
    expect(image).toContain('height: 88%;')
    expect(image).not.toContain('max-width: 100%;')
    expect(image).not.toContain('max-height: 100%;')
    expect(image).toContain('object-fit: contain;')
  })

  it('keeps the catalog usable on narrow screens', () => {
    expect(css).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.catalog \.logo-grid\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 680px\)[\s\S]*?\.catalog \.logo-grid\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  })
})
