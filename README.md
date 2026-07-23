# Web3Logo

Web3Logo is a pure-static, community-maintained registry of Web3 logo assets.
Astro generates the catalog, detail pages, local search index, sitemap, and
legacy redirects. The published site needs no API, database, wallet connection,
runtime secret, or server-side compute.

Production canonical URL: <https://web3logo.lxdao.io>

## Requirements

- Node.js 22.12 or newer
- pnpm 10
- Python 3.11 or newer (legacy importer tests and one-time migration only)

## Local development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The development server prints its local URL. Search reads an inline JSON index
from the generated homepage and makes no runtime network request.

Before opening a pull request, run:

```sh
pnpm validate
pnpm test
pnpm build
node scripts/validate-build.mjs
```

## Catalog format

Public metadata lives in `src/data/logos.json`; binary assets live below
`public/logos/<slug>/`. Each asset entry records its byte-detected format,
media type, SHA-256, byte size, local path, legacy asset ID, and original source
URL. Catalog records intentionally exclude uploader wallet addresses, download
counters, favorites, and other mutable or personal data.

Allowed files are SVG, PNG, JPEG, and WebP up to 5 MiB. SVG validation rejects
scripts, event handlers, `foreignObject`, executable URLs, external references,
doctypes, and entities. Do not weaken these checks to accommodate an unsafe
file; obtain a safe original from the project instead.

Run `pnpm generate` after editing catalog metadata. It deterministically updates
the local search index and Cloudflare Pages redirects.

## Contributing a logo

Use the [logo submission form](https://github.com/lxdao-official/web3logo-website/issues/new?template=logo-submission.yml)
when you want maintainers to prepare the repository change. Include the official
website, original source URL, category, aliases, licensing or trademark terms,
and the asset itself. Issue-to-PR conversion is manual and requires maintainer
review.

### Direct pull requests

For a direct contribution:

1. Add the original file under `public/logos/<slug>/<numeric-id>.<format>`.
2. Add or update the matching `src/data/logos.json` record, including SHA-256,
   byte size, source URL, rights statement, and verification note.
3. Run `pnpm generate`, `pnpm validate`, `pnpm test`, and `pnpm build`.
4. Complete the pull request provenance checklist.

Pull-request CI uses the `pull_request` event with read-only repository access.
It does not use Cloudflare, GitHub, API, or production secrets.

## Legacy migration

`scripts/import-legacy.py` takes a byte-for-byte snapshot of the complete public
legacy response, creates stable slugs and an ID map, downloads assets with
bounded concurrency/retries/timeouts, detects formats from bytes, sanitizes and
validates SVG files, and emits deterministic metadata. Remote downloads require
standard-port HTTPS, an explicit hostname allowlist, and public DNS/connected
peer addresses; redirects are rejected rather than followed.

```sh
python3 scripts/import-legacy.py --api-base https://api.web3logo.info
```

The API endpoint can instead be supplied as a complete URL with
`--catalog-url`; `file://` is supported only for rebuilding from a local catalog
snapshot, while asset downloads remain restricted to `cdn.lxdao.io`. The
importer logs aggregate counts only. Unsupported browser
formats, unsafe SVGs, unavailable CDN objects, oversized files, and insecure
legacy website links are excluded and recorded in
`migration/legacy-exclusions.json`. Source rows with no remaining browser-safe
asset are also omitted with an explicit logo-level exclusion.

The initial migration snapshot contains **944 published logos and 1,415 browser-safe assets**.
The exclusions ledger reconciles the legacy source to 10 omitted logo rows, 30 omitted assets,
and 11 omitted insecure website fields. All 954 legacy logo IDs retain exact old-path redirects:
published entries point to their static detail pages, while excluded entries point to a migration
notice instead of silently becoming 404s. All excluded IDs and reasons remain reviewable alongside
the byte-for-byte raw export.

## Deployment

The build output is `dist/` and is compatible with Cloudflare Pages. Use
`pnpm build` as the build command and `dist` as the output directory. Cloudflare
Git integration may deploy reviewed `main` commits; no runtime variables are
required. DNS changes and retirement of legacy services are separate, manual
cutover steps and are intentionally outside this repository workflow.
