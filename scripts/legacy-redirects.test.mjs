import { describe, expect, it } from 'vitest'
import {
  cloudflareLegacyRedirectLine,
  cloudflareLegacyRedirectSource,
} from './legacy-redirects.mjs'

describe('Cloudflare Pages legacy redirects', () => {
  it('keeps ordinary legacy paths static', () => {
    const entry = {
      legacyId: 1053,
      legacyPath: '/detail/0x499/1053',
      targetPath: '/logos/0x499/',
    }
    expect(cloudflareLegacyRedirectSource(entry)).toBe(entry.legacyPath)
    expect(cloudflareLegacyRedirectLine(entry)).toBe('/detail/0x499/1053 /logos/0x499/ 301')
  })

  it('uses an ID-anchored dynamic segment for encoded parentheses', () => {
    const entry = {
      legacyId: 880,
      legacyPath: '/detail/Avalanche%20%28AVAX%29/880',
      targetPath: '/logos/avalanche-avax/',
    }
    expect(cloudflareLegacyRedirectSource(entry)).toBe('/detail/*/880')
    expect(cloudflareLegacyRedirectLine(entry)).toBe(
      '/detail/*/880 /logos/avalanche-avax/ 301'
    )
  })
})