# PM Messages Removal & Reports Nav Move

## Summary

Removed the PM **Messages** (`/message`) feature from the product UI and moved **Reports** from the Navigate grid into **Workspace tools**.

## Scope

- `apps/pm/components/PMSidebar.jsx` — nav items
- `apps/pm/app/message/page.js` — deleted
- `apps/pm/lib/api/messageService.js` — DM client helpers removed; org/assignee helpers kept
- `apps/pm/lib/usePmSidebarBadges.js` — inbox-only badge
- `apps/pm/lib/rbac.js` — `/message` route module entry removed
- `apps/pm/app/inbox/page.js` — “Direct messages” shortcut removed

Backend `direct-message` API is unchanged (unused by PM UI for now).

## Details

### Navigate

- **Removed:** Message tab
- **Unchanged:** Dashboard, My Tasks, Inbox, Clients
- Navigate grid is now up to 4 tiles (Clients still RBAC-gated)

### Workspace tools

Order is now:

1. Documents (coming soon)
2. Calendar
3. Reports → `/analytics` (full Reports page; see `PM_REPORTS_PAGE.md`)

### Messages feature

- Page route `/message` removed
- `fetchMessageContacts` / `fetchConversation` / `sendDirectMessage` removed from the PM client
- `messageService.js` remains as the org member / assignable-user helper used by projects, tasks, and mentions

## Usage / Migration

- Bookmarks to `/message` will 404; use Inbox for notifications and entity comment threads on tasks/projects for collaboration
- Reports opens from **Tools → Workspace tools → Reports**
