# ConfirmDeleteModal List Migration

## Summary

CRM/PM list pages that duplicated the red-banner destructive delete `Modal` now use shared `ConfirmDeleteModal` from `@webfudge/ui`. Dead no-op filter/import/export handlers were removed on Deals, Deals pipeline, Proposals, and Invoices.

## Scope

### Shared component

- `packages/ui/components/ConfirmDeleteModal/ConfirmDeleteModal.jsx` — optional `children` slot for extra warning content (e.g. lead company cascade list)

### Migrated list pages

- `apps/crm/app/sales/contacts/page.js`
- `apps/crm/app/sales/lead-companies/page.js`
- `apps/crm/app/sales/deals/page.js`
- `apps/crm/app/clients/accounts/page.js`
- `apps/crm/app/clients/tasks/page.js`
- `apps/crm/app/clients/projects/page.js`
- `apps/crm/app/clients/invoices/page.js`
- `apps/crm/app/clients/proposals/page.js`
- `apps/crm/app/automations/page.js`
- `apps/pm/app/clients/accounts/page.js`
- `apps/pm/app/projects/page.js`
- `apps/pm/app/my-tasks/page.js`

### Dead toolbar fixes (no delete modal)

- `apps/crm/app/sales/deals/pipeline/page.js` — hide filter; remove header filter/import/export no-ops

### Skipped / keep custom

- Meetings list (different pattern)
- Accounts users delete (assignment transfer flow)

## Usage

```jsx
import { ConfirmDeleteModal } from '@webfudge/ui'

<ConfirmDeleteModal
  isOpen={!!deleteId}
  onClose={() => { if (!loading) setDeleteId(null) }}
  onConfirm={confirmDeleteFn}
  title="Delete Contact"
  description="Are you sure you want to delete this contact?"
  confirmLabel="Delete Contact"
  loading={!!deletingId}
  loadingLabel="Deleting…"
/>
```

Pass `children` when extra content is needed between the description and the action buttons.
