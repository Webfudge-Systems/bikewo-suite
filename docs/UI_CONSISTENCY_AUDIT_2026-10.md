# UI Consistency Audit — Oct 2026

## Summary

Full-suite pass across **CRM**, **PM**, **Accounts**, **Client Portal**, and `@webfudge/*` packages. Shared table stack is healthy (`Table` + column prefs + CRM cells). Remaining drift was mostly **hand-rolled empties**, **duplicated delete modals**, **dead filter/export buttons**, and **uneven feature adoption** (sort/filter) across similar list modules.

This pass **fixed** empties, delete dialogs, and dead toolbar handlers. Remaining items are tracked below for follow-up.

## Scope

| Area | Apps / packages |
|------|-----------------|
| Apps | `crm`, `pm`, `accounts`, `client-portal` (`linkedin-extension` = vanilla JS, out of React parity) |
| Packages | `@webfudge/ui`, `@webfudge/utils`, `@webfudge/auth`, `@webfudge/hooks`, `@webfudge/config` |

## Shared stack (canonical)

| Concern | Use from `@webfudge/ui` (or utils) |
|---------|-----------------------------------|
| Lists | `Table` (`modern` / `modernEmbedded`) — **no** separate `DataTable` |
| Column prefs | `useTableColumnPreferences`, `TableColumnPicker` |
| Sort | `useTableSort` / app entity hooks + `TableSortDropdown` |
| Empty (under table) | `TableEmptyBelow` (+ `TableResultsCount`) |
| Empty (full page) | `EmptyState` |
| Delete confirm | **`ConfirmDeleteModal`** (new) |
| Forms | `FormSectionCard`, `Button`, `Input`, `Select`, … |
| Shell | `AppPageHeader`, `WorkspaceLayoutContent`, `AppShell` |
| Format / CRM shared | `@webfudge/utils` |

## Fixed in this pass

1. **List empties → `TableEmptyBelow`** (17 CRM/PM/Accounts list pages) — see [TABLE_EMPTY_BELOW_LIST_MIGRATION.md](./TABLE_EMPTY_BELOW_LIST_MIGRATION.md)
2. **`ConfirmDeleteModal`** added to `@webfudge/ui`; CRM/PM list deletes migrated — see [CONFIRM_DELETE_MODAL_LIST_MIGRATION.md](./CONFIRM_DELETE_MODAL_LIST_MIGRATION.md); also PM projects + my-tasks
3. **Dead toolbar handlers removed**: Deals, Deals pipeline, Proposals, Invoices (no-op filter/import/export no longer shown)

## Feature matrix (main lists)

| Module | Table | Col prefs | Sort | Filter UI | Empty | Delete |
|--------|-------|-----------|------|-----------|-------|--------|
| CRM Lead companies / Contacts | ✅ | ✅ | ✅ | Modal | ✅ shared | ✅ shared |
| CRM Deals | ✅ | ✅ | ✅ | hidden (tabs cover stage) | ✅ | ✅ |
| CRM Client accounts / tasks / projects | ✅ | ✅ | ❌ | Modal | ✅ | ✅ |
| CRM Invoices / Proposals | ✅ | ✅ | ❌ | Invoices: modal; Proposals: hidden | ✅ | ✅ |
| CRM Meetings | ✅ | ✅ | ❌ | inline panel | ✅ | local |
| PM projects / my-tasks / client accounts | ✅ | ✅ | ✅ | Modal | ✅ | ✅ |
| Accounts users / roles / depts / audit | ✅ | ✅ | ❌ | none / inline | ✅ | custom (transfer) |
| Portal tasks / projects / company | ✅ | mostly | ✅ | none (by design) | custom / dashed | custom |

## Remaining inconsistencies (prioritized)

### High — follow-up

| Issue | Recommendation |
|-------|----------------|
| CRM **clients** modules lack multi-column sort | Extend `apps/crm/lib/tableSortColumns.js` + `tableSortValues.js`; wire `useCrmTableSort` like sales lists |
| No shared **Filter modal shell** | Extract `EntityFilterModal` (draft/apply/clear) into `@webfudge/ui`; Meetings should use Modal pattern |
| CRM ↔ PM **client accounts** ~duplicate pages | Share list module or extract common table/toolbar config |
| PM ↔ Portal **task/project** meta bars & panels | Fold into `@webfudge/ui` with permission props |

### Medium

| Issue | Recommendation |
|-------|----------------|
| `GlobalSearchModal` duplicated in CRM/PM/portal | Build on `WorkspaceSearchModal` only |
| `PMStatusBadge` vs `TableCrmCells` status maps | Prefer shared option constants / cell fills |
| CRM/PM parallel `tableSortColumns` maps | Keep entity maps local; avoid UI aliases (`CrmTableSortDropdown`) |
| Dashboard widgets still use raw `<table>` | Compact shared `Table` variant or keep OK for dense widgets |
| Portal communities: no column prefs / sort | Add when columns grow |
| Accounts: no list sort; delete uses transfer modal | Keep transfer flow; optional sort later |
| Column picker title strings differ | Standardize to one phrase |

### Low / intentional

| Issue | Notes |
|-------|--------|
| Portal `MainLayout` ≠ CRM/PM `AppShell` | Documented intentional |
| `/sales/leads` stub vs lead-companies | Redirect or retire stub |
| `@webfudge/hooks` / config JS API unused | Hooks live in UI; config via Tailwind preset |
| `packages/ui/docs/README.md` undercounts components | Update inventory |
| LinkedIn extension | Not React; CRM lists remain system of record |

## Reuse guidelines

1. New list pages: compose `TabsWithActions` + `Table` + `TableEmptyBelow` + `ConfirmDeleteModal` + column prefs; add sort maps when > few columns.
2. Never ship `onFilterClick={() => {}}` / `onExportClick={() => {}}` — omit the prop or `showFilter={false}`.
3. Prefer `@webfudge/ui` / `@webfudge/utils` over app-local copies; thin app wrappers only for data/RBAC (e.g. `CRMPageHeader`).
4. Do **not** invent a new `DataTable` — extend existing pieces.

## Related docs

- [CROSS_APP_UI_CONSOLIDATION.md](./CROSS_APP_UI_CONSOLIDATION.md)
- [SHARED_UI_OPTIMIZATION.md](./SHARED_UI_OPTIMIZATION.md)
- [TABLE_COLUMN_PREFERENCES.md](./TABLE_COLUMN_PREFERENCES.md)
- [PM_TABLE_EMPTY_STATE_UPDATE.md](./PM_TABLE_EMPTY_STATE_UPDATE.md)
- [CLIENT_PORTAL_UI_ALIGNMENT.md](./CLIENT_PORTAL_UI_ALIGNMENT.md)
- [TABLE_EMPTY_BELOW_LIST_MIGRATION.md](./TABLE_EMPTY_BELOW_LIST_MIGRATION.md)
- [CONFIRM_DELETE_MODAL_LIST_MIGRATION.md](./CONFIRM_DELETE_MODAL_LIST_MIGRATION.md)
