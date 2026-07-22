import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { identifyFormat, svgSafetyErrors } from './asset-safety.mjs'
import { ASSET_EXCLUSION_REASONS, assetExclusionSchema } from './exclusion-reasons.mjs'
import { validateAssets } from './validate-assets.mjs'

describe('asset byte validation', () => {
  it('accepts every importer exclusion reason, including unsafe URLs', () => {
    expect(ASSET_EXCLUSION_REASONS).toContain('unsafe-url')
    expect(
      assetExclusionSchema.safeParse({
        legacyLogoId: 1,
        legacyAssetId: 2,
        sourceUrl: 'http://127.0.0.1/private',
        reason: 'unsafe-url',
      }).success
    ).toBe(true)
  })

  it('ignores misleading extensions and identifies supported signatures', () => {
    expect(identifyFormat(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('png')
    expect(identifyFormat(Buffer.from([255, 216, 255, 224]))).toBe('jpg')
    expect(identifyFormat(Buffer.from('RIFF0000WEBP'))).toBe('webp')
    expect(identifyFormat(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('svg')
    expect(identifyFormat(Buffer.from('<!-- source --><svg/>'))).toBe('svg')
    expect(identifyFormat(Buffer.from('GIF89a'))).toBeNull()
  })

  it.each([
    '<svg><script>alert(1)</script></svg>',
    '<svg xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>',
    '<svg><foreignObject><p>unsafe</p></foreignObject></svg>',
    '<svg><path onclick="alert(1)"/></svg>',
    '<svg xmlns:x="urn:test"><path x:onclick="alert(1)"/></svg>',
    '<svg><a href="javascript:alert(1)"/></svg>',
    '<svg><image href="https://example.org/logo.png"/></svg>',
    '<svg><style>@import "https://example.org/a.css"</style></svg>',
    '<svg><path style="fill:url(https://example.org/a.svg#x)"/></svg>',
    '<!DOCTYPE svg><svg/>',
    '<?xml-stylesheet href="https://example.org/a.css"?><svg/>',
  ])('rejects dangerous SVG: %s', (source) => {
    expect(svgSafetyErrors(Buffer.from(source))).not.toEqual([])
  })

  it('allows local fragment references', () => {
    const source = Buffer.from('<svg><style>.a{fill:url(\'#paint\')}</style><path fill="url(#paint)"/></svg>')
    expect(svgSafetyErrors(source)).toEqual([])
  })

  it('rejects files under public/logos that are not referenced by the catalog', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'web3logo-assets-'))
    const assetDirectory = join(repositoryRoot, 'public', 'logos', 'example')
    const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    try {
      await mkdir(assetDirectory, { recursive: true })
      await writeFile(join(assetDirectory, 'orphan.png'), bytes)
      const result = await validateAssets([], repositoryRoot)
      expect(result.errors).toEqual(['unreferenced asset file: example/orphan.png'])
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true })
    }
  })

  it('rejects referenced symbolic links', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'web3logo-assets-'))
    const assetDirectory = join(repositoryRoot, 'public', 'logos', 'example')
    const target = join(repositoryRoot, 'target.svg')
    try {
      await mkdir(assetDirectory, { recursive: true })
      await writeFile(target, '<svg/>')
      await symlink(target, join(assetDirectory, 'linked.svg'))
      const result = await validateAssets(
        [
          {
            slug: 'example',
            assets: [{ format: 'svg', path: '/logos/example/linked.svg' }],
          },
        ],
        repositoryRoot
      )
      expect(result.errors).toContain('example: asset file must not be a symbolic link')
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true })
    }
  })
})
