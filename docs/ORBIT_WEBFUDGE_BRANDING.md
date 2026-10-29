# Orbit / Platform Admin — Webfudge Systems Branding Update

## Summary

Replaced Fudge Orbit / BikeWo hybrid branding in the organization-manager app with **full Webfudge Systems branding** — naming, logos, favicons, theme color, and copy.

## Scope

- `apps/organization-manager` (Platform Admin / Orbit)
- `packages/utils/src/siteBranding.js` — added `webfudgeMetadataIcons()` helper

## Before / After

| Element | Before | After |
|---------|--------|-------|
| Product name | Fudge Orbit | Platform Admin |
| Brand | BikeWo (+ "by Webfudge Systems") | Webfudge Systems |
| Logo / icon | `public/favicon_io/` (BikeWo) | `public/favicon/` + `public/logo/` (Webfudge) |
| Favicon / PWA manifest | BikeWo pink (`#FF4A74`) | Webfudge orange (`#F5630F`) |
| Login copy | "…across the BikeWo suite" | "…across the Webfudge Systems platform" |

## Key files

- `apps/organization-manager/lib/site.js` — single source for name, assets, theme
- `apps/organization-manager/app/layout.js` — metadata icons via `webfudgeMetadataIcons()`
- `apps/organization-manager/app/login/page.js` — login branding panel
- `apps/organization-manager/components/PlatformSidebar.jsx` — sidebar header
- `apps/organization-manager/public/favicon/site.webmanifest` — PWA install config

## Notes

- Other suite apps (CRM, PM, Accounts, Books) still use Fudge Suite / BikeWo-primary branding per [FUDGE_SUITE_BRANDING.md](./FUDGE_SUITE_BRANDING.md).
- Legacy BikeWo assets remain under `public/favicon_io/` but are no longer referenced by the app.
