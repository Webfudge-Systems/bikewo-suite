# Fudge Suite Branding Update

## Summary

Aligned workspace apps to **Option A — Fudge Suite** branding: each app is a named BikeWo internal product with a subtle **by Webfudge Systems** credit. Shared **BikeWo favicons** (`public/favicon/`) and **primary logo** (`public/logos/bikewo-logo-primary.png`) are used across CRM, PM, Accounts, and Client Portal.

## Scope

| App | Product name | Config |
|-----|--------------|--------|
| CRM | Fudge Grow | `apps/crm/lib/site.js` |
| PM | Fudge Work | `apps/pm/lib/site.js` |
| Accounts | Fudge Base | `apps/accounts/lib/site.js` |
| Client portal | BikeWo Client Portal | `apps/client-portal/src/lib/site.js` |

## Shared assets

| Asset | Path |
|-------|------|
| Favicon set | `public/favicon/` |
| Full logo | `public/logos/bikewo-logo-primary.png` |
| App Router tab icon | `app/favicon.ico` + `app/apple-icon.png` |
| Metadata helper | `bikewoMetadataIcons()` + `FUDGE_SUITE_ASSETS.bikewo` from `@webfudge/utils` |

## Visual pattern

- **Sidebar / login icon:** BikeWo PWA icon from `public/favicon/` (e.g. `web-app-manifest-512x512.png`)
- **Full brand logo:** `public/logos/bikewo-logo-primary.png`
- **Creator credit:** text only (`by Webfudge Systems`) — no separate creator image asset
- **Browser tab / PWA:** `public/favicon/`
- **Primary title:** Product name (e.g. Fudge Grow)
- **Secondary line:** `by Webfudge Systems` (small, muted)

Shared paths live in `packages/utils/src/siteBranding.js` (`FUDGE_SUITE_ASSETS`).

## Key files per app

- `lib/site.js` — single source for name, logo, creator line
- Sidebar header — product name + creator line
- Login page — BikeWo wordmark; product name + creator line as text (`LoginBrandCorner`, `LoginProductCredit` in `@webfudge/ui`)
- `public/favicon/site.webmanifest` — PWA install name (BikeWo)
