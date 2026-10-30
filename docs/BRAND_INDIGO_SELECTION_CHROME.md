# Brand Indigo for Selection Chrome

## Summary

Rebalanced UI so **BikeWo Indigo** (`#241F5D` / `brand-indigo`) carries more visual weight for selection and navigation chrome, while **BikeWo Green** (`#2AB77C` / `brand-primary`) stays focused on primary CTAs and success accents. This restores the intended brand ratio (~25% indigo / ~10% green) after green had taken over most active states.

## Scope

- Shared UI: `ViewToggleGroup`, `TabsWithActions`, `FormSectionCard` icon default
- CRM: dashboard view switcher, Short/Detailed form toggle, sidebar active tiles, detail-page tab pills, edit form section icons
- PM / Accounts / Client Portal: sidebar active states, matching detail tab pills where shared

## Rules of thumb

| Use | Token |
|-----|--------|
| Active toggles, tabs, sidebar items, section icon chips | `bg-brand-indigo` |
| Primary buttons / Create / Save CTAs | `bg-brand-primary` (green) |
| Headings / structure text | `text-brand-indigo` / `brand-foreground` |

## Usage

No migration — refresh CRM/PM/Accounts (and client portal if open). Green submit buttons should still look green; selected nav and segmented controls should look indigo blue.
