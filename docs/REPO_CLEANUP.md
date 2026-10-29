# Repo Cleanup Summary

## Summary

Removed dead assets, unused packages, empty stub folders, obsolete docs for apps that are not in this monorepo, and tightened gitignore so generated/cache files stay out of git.

## Scope

- Apps: `accounts`, `crm`, `pm`, `client-portal`, `backend`, `linkedin-extension`
- Packages: removed unused `@webfudge/hooks`
- Root: `.gitignore`, `package.json`, `README.md`, `docs/`

## Details

### Assets
- Replaced legacy `public/favicon_io/` and `public/logo/` with `public/favicon/` + `public/logos/bikewo-logo-primary.png` across Accounts, CRM, PM, and Client Portal
- Removed unused logo variants (mono/reversed/white/marks) and unused Webfudge vertical logo file
- Untracked generated Accounts `public/sw.js` (matches CRM/PM Serwist ignore)

### Code / packages
- Deleted unused `packages/hooks` (`@webfudge/hooks` had no app imports)
- Removed dead `scripts/strip-console.js` (targeted old non-monorepo paths) and `strip-console` npm script
- Removed unused `creatorLogoPath` / `creatorIconPath` from app `lib/site.js` configs
- Removed CRM `app/components-test` harness
- Removed empty stub folders (`guards`, `services`, empty `modules/*`, empty tooling placeholders, empty `.github/workflows`)

### Local disk (gitignored)
- Cleared `.next`, `.turbo`, LinkedIn `dist`, Strapi `.tmp` / `.strapi` caches

### Docs
- Removed obsolete one-shot / ghost-app docs (Landing, Orbit, VLM, checklist/completion summaries, components-test guides)
- Scrubbed broken index links from `DOCUMENTATION_INDEX.md`
- Updated branding asset paths in `FUDGE_SUITE_BRANDING.md`

### Gitignore
- Root: ignore all `*.log`
- Accounts: ignore `public/sw*` and `public/swe-worker*` like CRM/PM

## Not removed (intentional)

- `docs/` feature change summaries that still describe live CRM/PM/Accounts/Portal behavior
- Client portal `public/images/download (10).png` (still used on auth page)
- Root `serwist` / `@serwist/next` deps (used by CRM/PM PWA builds via workspace)
- `node_modules` (reinstall with `npm install`)
