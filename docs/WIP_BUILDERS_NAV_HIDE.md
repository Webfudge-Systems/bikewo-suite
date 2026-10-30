# WIP Builders — Nav Hidden on Master

## Summary

**Automation**, **Proposals**, and **Invoices** builder UIs stay in the repo, but their CRM navigation entry points are hidden on `master` until the features are finalized. Work continues on branch `feature/wip-builders`, where the nav is shown.

## Scope

- Flag: `apps/crm/lib/wipNavFeatures.js` → `SHOW_WIP_BUILDER_NAV`
- CRM sidebar: Automation button; Workspace → Proposals; Clients → Invoices
- CRM quick actions: “New Proposal” (same flag)
- **Not removed:** `/automations/*`, `/clients/proposals/*`, `/clients/invoices/*` pages and APIs

## Branch workflow

| Branch | `SHOW_WIP_BUILDER_NAV` | Nav |
|--------|------------------------|-----|
| `master` | `false` | Hidden |
| `feature/wip-builders` | `true` | Visible |

1. Develop builders on `feature/wip-builders` (nav on).
2. When ready, merge to `master` and set `SHOW_WIP_BUILDER_NAV` to `true` (or remove the gate).

## Direct access

Even with nav hidden, routes still work if you open the URL manually.
