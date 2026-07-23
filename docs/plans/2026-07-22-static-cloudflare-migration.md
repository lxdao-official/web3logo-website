# Web3Logo Static Cloudflare Migration Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the stateful Next.js/NestJS/Web3Logo stack with a GitHub-owned, pure-static, searchable logo registry deployed automatically to Cloudflare Pages at `web3logo.lxdao.io`.

**Architecture:** The public GitHub repository is the source of truth for metadata and small SVG/PNG/WebP assets. A one-time importer snapshots the legacy public API and CDN assets into versioned files. Astro generates the homepage, static detail pages, search index, sitemap, and legacy redirects; a small client-side TypeScript search engine handles normalized and fuzzy matching. Contributions enter through GitHub Issue Forms or normal pull requests, and secret-free CI validates content before Cloudflare's Git integration publishes merged `main`.

**Tech Stack:** Astro 7, TypeScript, pnpm 10, Vitest, Zod, GitHub Actions, Cloudflare Pages.

---

## Safety and cutover gates

1. Do not stop or delete the existing Coolify frontend, backend, PostgreSQL database, or CDN assets before the new static site passes local and public verification.
2. Preserve a raw legacy export, deterministic legacy-ID-to-slug mapping, asset hashes, and source URLs.
3. Do not create an in-site GitHub API proxy or store a GitHub token in client code.
4. Run untrusted pull-request CI without secrets and without `pull_request_target`.
5. Do not change DNS until the Cloudflare preview serves the expected search, detail pages, assets, sitemap, headers, and redirects.
6. After cutover, stop old Coolify resources through Coolify while retaining resources and backups for rollback; deletion is a separate decision.

## Task 1: Establish migration snapshot and deterministic importer

**Files:**
- Create: `scripts/import-legacy.py`
- Create: `scripts/validate-assets.mjs`
- Create: `migration/legacy-active-export.json`
- Create: `migration/legacy-id-map.json`
- Create: `src/data/logos.json`
- Create: `public/logos/**`

**Steps:**
1. Fetch the complete active catalog from the public legacy endpoint and save the response byte-for-byte.
2. Normalize display names and deterministic slugs; preserve collision suffixes using legacy IDs.
3. Download every active CDN asset with bounded concurrency, timeout, retry, and maximum-size limits.
4. Identify formats from bytes rather than the legacy `fileType` field.
5. Reject unsupported or dangerous files; sanitize SVGs and forbid scripts, event handlers, `foreignObject`, JavaScript URLs, and external references.
6. Record source URL, legacy IDs, SHA-256, byte size, and local path.
7. Write a compact public catalog without uploader wallet addresses or mutable social counters.
8. Re-run the importer and prove that generated metadata and asset hashes are deterministic.

## Task 2: Replace the application with a pure-static Astro site

**Files:**
- Replace: `package.json`
- Replace: `pnpm-lock.yaml`
- Remove: legacy Next.js runtime files and lockfile
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/logos/[slug].astro`
- Create: `src/pages/submit.astro`
- Create: `src/components/LogoCard.astro`
- Create: `src/styles/global.css`
- Create: `src/lib/catalog.ts`
- Create: `src/lib/search.ts`
- Create: `src/scripts/search-client.ts`

**Steps:**
1. Add Astro static output with canonical site `https://web3logo.lxdao.io`.
2. Render an accessible homepage with visible logo names, category filters, and progressive show-more behavior.
3. Build one static detail page per catalog entry with direct asset downloads, source/license/verification metadata, and related items capped to a small deterministic set.
4. Remove wallet, favorites, upload API, personal page, counters, and admin UI.
5. Keep the initial JavaScript payload small; search is the only required client-side behavior.
6. Add responsive styles where download actions are always visible on touch devices.

## Task 3: Implement deterministic normalized search

**Files:**
- Create: `src/lib/search.ts`
- Create: `src/lib/search.test.ts`
- Create: `public/search-index.json` through a build script

**Steps:**
1. Normalize with Unicode NFKC, case folding, diacritic removal, and punctuation/whitespace removal.
2. Rank exact name, exact alias, prefix, substring, then bounded edit-distance fuzzy matches.
3. Add regression cases for `ethpanda`, `ETH Panda`, `eth-pand-a`, and `ethpand` resolving to `ETHPanda`.
4. Add tests for empty queries, Chinese names, category filters, duplicate slugs, and typo limits.
5. Keep search entirely local and deterministic; no Worker/API/database.

## Task 4: Add GitHub contribution and validation workflow

**Files:**
- Create: `.github/ISSUE_TEMPLATE/logo-submission.yml`
- Create: `.github/pull_request_template.md`
- Create: `.github/workflows/validate.yml`
- Create: `scripts/validate-content.mjs`
- Replace: `README.md`

**Steps:**
1. Issue Form requires project name, official website, source URL, category, aliases, licensing/trademark statement, and asset attachment/source link.
2. README documents both issue-based requests and direct asset PRs.
3. CI validates schema, unique slugs, allowed formats, file limits, hashes, SVG safety, search tests, build output, sitemap, and legacy redirects.
4. CI uses `pull_request` and receives no production secrets.
5. Keep issue-to-PR conversion manual initially; automation may be added only behind a trusted maintainer approval label.

## Task 5: Generate SEO and migration compatibility artifacts

**Files:**
- Create: `src/pages/robots.txt.ts`
- Create: sitemap integration/configuration
- Generate: `public/_redirects`
- Create: `public/_headers`

**Steps:**
1. Generate one canonical detail URL per logo and include all detail pages in sitemap output.
2. Generate exact redirects from legacy `/detail/<name>/<id>` paths to `/logos/<slug>/` within Cloudflare Pages limits.
3. Add security and caching headers suitable for static content.
4. Preserve the old `web3logo.info` path shape during the redirect window.

## Task 6: Verify locally and package the change

**Commands:**
- `zsh -ic 'pnpm install --frozen-lockfile'`
- `zsh -ic 'pnpm run validate'`
- `zsh -ic 'pnpm test'`
- `zsh -ic 'pnpm build'`
- Start a local preview and verify `/`, `/logos/ethpanda/`, `/submit/`, `/search-index.json`, `/sitemap-index.xml` or `/sitemap-0.xml`, representative assets, 404 behavior, and legacy redirects.

**Acceptance:**
- Catalog and active-asset counts reconcile with the migration snapshot or every exclusion is documented.
- `ethpanda`, `ETH Panda`, and `ethpand` all find `ETHPanda`.
- No network request is needed for search.
- No runtime secrets, database coordinates, wallet libraries, or backend URLs remain.
- Git worktree is clean after the intended commit.

## Task 7: Push, preview, and cut over

1. Push `refactor/static-cloudflare` and open a PR with the migration evidence and rollback plan.
2. Verify GitHub checks and Cloudflare PR Preview.
3. Merge only after public Preview verification.
4. Attach `web3logo.lxdao.io` as the production custom domain and verify DNS, TLS, search, assets, sitemap, redirects, and headers.
5. While `web3logo.info` remains registered, redirect it to the new hostname and update canonical links.
6. Stop the old Coolify frontend/backend/database only after public verification; retain all source resources and backups for rollback.
