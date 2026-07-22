import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://web3logo.lxdao.io',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
})
