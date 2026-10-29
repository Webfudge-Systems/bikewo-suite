# TableEmptyBelow List Empty Migration

## Summary

Hand-rolled list empty states (`p-12` + `text-lg font-semibold text-gray-700`) on CRM, PM, and Accounts list pages were replaced with shared `TableEmptyBelow` from `@webfudge/ui` for consistent typography (title: `text-base` / `text-gray-900`), icon treatment, spacing, and optional actions.

## Scope

### CRM
- `apps/crm/app/sales/lead-companies/page.js` (table + kanban)
- `apps/crm/app/sales/contacts/page.js`
- `apps/crm/app/sales/deals/page.js` (table + kanban)
- `apps/crm/app/clients/accounts/page.js`
- `apps/crm/app/clients/tasks/page.js`
- `apps/crm/app/clients/projects/page.js`
- `apps/crm/app/clients/invoices/page.js`
- `apps/crm/app/clients/proposals/page.js`
- `apps/crm/app/meetings/page.js`
- `apps/crm/app/automations/page.js`

### PM
- `apps/pm/app/my-tasks/page.js` (table + kanban)
- `apps/pm/app/projects/page.js` (table + kanban)
- `apps/pm/app/clients/accounts/page.js`

### Accounts
- `apps/accounts/app/users/page.js`
- `apps/accounts/app/roles/page.js`
- `apps/accounts/app/departments/page.js`
- `apps/accounts/app/audit-logs/page.js`

Nested detail-page empties (e.g. `accounts/[id]` contacts tabs) were left unchanged.

## Pattern

**Before:** custom `div` with large icon, `h3` (`text-lg` / `text-gray-700`), description, optional buttons.

**After:**

```jsx
import { TableEmptyBelow } from '@webfudge/ui'

<TableEmptyBelow
  icon={SomeIcon}
  title="No X found"
  description={...}
  action={optionalJsxOrNull}
  className="border-t border-gray-200" // under a Table inside a card
/>
```

Kanban / full-page empties omit `border-t` (no table divider). Description text and action button logic are preserved as-is.

## Related

- Component: `packages/ui/components/TableEmptyBelow/TableEmptyBelow.jsx`
- Earlier PM alignment notes: [PM_TABLE_EMPTY_STATE_UPDATE.md](./PM_TABLE_EMPTY_STATE_UPDATE.md)
