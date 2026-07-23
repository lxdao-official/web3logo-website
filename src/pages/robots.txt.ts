import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://web3logo.lxdao.io')
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', origin)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}
