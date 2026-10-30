# BikeWo Brand Colors Update

## Summary

Aligned CRM, PM, and Accounts (plus shared `@webfudge/config` / `@webfudge/ui`) to **BikeWo Brand Guidelines v1.0**. Replaced the previous orange (`#F5630F`) system with the official **Indigo + Green** palette. Fonts were not changed (Host Grotesk remains).

Login screens now show the **full BikeWo logo** (wordmark + rider mark + “Electrifying India”), using the reversed lockup on indigo panels.

## Official palette

| Token | HEX | Role |
|-------|-----|------|
| BikeWo Indigo | `#241F5D` | Structure, type, dark surfaces, CTA labels |
| BikeWo Green | `#2AB77C` | Energy, action, accent, primary CTA surface |
| Midnight | `#14113A` | Deepest surfaces / login hero |
| Charge Green | `#35D68F` | Screen highlights / active peaks |
| Cloud | `#F1F1F5` | Default light surface |
| Slate | `#4A4869` | Body text on light |
| Pure White | `#FFFFFF` | Dominant light surface |

**Accessibility (from guidelines):**

- Green text on white → **Green 700 `#17754F` only**
- Primary button label → **Indigo on Green** (never white on green)

## Scope

- `packages/config/src/brand/colors.js` — canonical tokens, ramps, gradients, shadows
- `packages/config/tailwind.preset.js` — shared Tailwind mapping (`orange-*` remapped to green ramp so existing action classes pick up brand green)
- `packages/ui/themes/index.js` — UI theme tokens
- `packages/ui/components/Button/Button.jsx` — indigo label on green primary
- `packages/ui/components/LoginBrandCorner/*` — full logo on login
- `packages/utils/src/siteBranding.js` — `brandLogoReversedPath`
- `apps/crm`, `apps/pm`, `apps/accounts` — Tailwind brand tokens, `themeColor` / `backgroundColor`, login pages
- New assets: `public/logos/bikewo-logo-reversed.png` in each app

## Login behaviour

| Surface | Asset |
|---------|--------|
| Desktop indigo panel | `/logos/bikewo-logo-reversed.png` |
| Mobile light form column | `/logos/bikewo-logo-primary.png` |

Panel background: `from-brand-indigo to-brand-midnight` (Night gradient).

## Usage notes

- Prefer `brand-primary` / `orange-500` (now green) for CTAs
- Prefer `brand-indigo` / `brand-dark` for headings and structure
- Prefer `brand-light` / Cloud for page backgrounds
- Do not change Host Grotesk / existing font stacks as part of brand colour work
