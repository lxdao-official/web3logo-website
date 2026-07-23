import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('static search integration', () => {
  it('embeds its index and performs no runtime fetch', async () => {
    const [page, client] = await Promise.all([
      readFile(resolve(root, 'src/pages/index.astro'), 'utf8'),
      readFile(resolve(root, 'src/scripts/search-client.ts'), 'utf8'),
    ])

    expect(page).toContain('id="search-index"')
    expect(page).toContain('type="application/json"')
    expect(client).not.toMatch(/\bfetch\s*\(/)
  })
})