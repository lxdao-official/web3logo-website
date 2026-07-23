import { describe, expect, it } from 'vitest'
import { orderHomepageLogos } from './homepage-order'

describe('orderHomepageLogos', () => {
  it('pins LXDAO and ETHPanda first while retaining the remaining order', () => {
    const logos = [
      { slug: 'aave' },
      { slug: 'ethpanda' },
      { slug: 'uniswap' },
      { slug: 'lxdao' },
    ]
    expect(orderHomepageLogos(logos).map((logo) => logo.slug)).toEqual([
      'lxdao',
      'ethpanda',
      'aave',
      'uniswap',
    ])
  })
})
