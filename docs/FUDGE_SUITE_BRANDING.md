# Fudge Suite Branding Update

## Summary

Aligned workspace apps to **Option A — Fudge Suite** branding: each app is a named BikeWo internal product with a subtle **by Webfudge Systems** credit. Shared **BikeWo favicons** (`public/favicon/`) and **primary logo** (`public/logos/bikewo-logo-primary.png`) are used across CRM, PM, Accounts, and Client Portal.

## Scope

| App | Product name | Credit line | Config |
|-----|--------------|-------------|--------|
| CRM | BikeWo Grow | Fudge System | `apps/crm/lib/site.js` |
| PM | BikeWo Work | Fudge System | `apps/pm/lib/site.js` |
| Accounts | BikeWo Base | Fudge System | `apps/accounts/lib/site.js` |
| Client portal | BikeWo Client Portal | — | `apps/client-portal/src/lib/site.js` |

## Shared assets

| Asset | Path |
|-------|------|
| Favicon set | `public/favicon/` |
| Full logo (light surfaces) | `public/logos/bikewo-logo-primary.png` |
| Full logo reversed (indigo / midnight) | `public/logos/bikewo-logo-reversed.png` |
| App Router tab icon | `app/favicon.ico` + `app/apple-icon.png` |
| Metadata helper | `bikewoMetadataIcons()` + `FUDGE_SUITE_ASSETS.bikewo` from `@webfudge/utils` |

Brand colours (Indigo `#241F5D` + Green `#2AB77C`) are documented in `docs/BIKEWO_BRAND_COLORS_UPDATE.md`.

## Visual pattern

- **Sidebar / login icon:** BikeWo PWA icon from `public/favicon/` (e.g. `web-app-manifest-512x512.png`)
- **Full brand logo:** `public/logos/bikewo-logo-primary.png`
- **Creator credit:** text only (`by Webfudge Systems`) — no separate creator image asset
- **Browser tab / PWA:** `public/favicon/`
- **Primary title:** Product name (e.g. BikeWo Grow)
- **Secondary line:** `Fudge System` (small, muted)

Shared paths live in `packages/utils/src/siteBranding.js` (`FUDGE_SUITE_ASSETS`).

## Key files per app

- `lib/site.js` — single source for name, logo, creator line
- Sidebar header — product name + creator line
- Login page — full BikeWo logo; product name (e.g. BikeWo Grow) + `Fudge System` credit (`LoginBrandCorner`, `LoginProductCredit` in `@webfudge/ui`)
- `public/favicon/site.webmanifest` — PWA install name (BikeWo)
