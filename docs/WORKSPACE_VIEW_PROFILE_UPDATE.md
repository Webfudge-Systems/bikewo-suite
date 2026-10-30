# Workspace View Profile Update

## Summary

Added a shared **View Profile** page for CRM, PM, and Accounts. The workspace header profile menu now navigates to `/profile` and no longer shows a **Settings** item (that control was a no-op).

## Scope

- `packages/ui/components/WorkspaceHeader/WorkspaceHeader.jsx` — View Profile → `/profile`; Settings removed
- `packages/ui/components/WorkspaceProfileView/` — shared read-only profile UI
- `apps/crm/app/profile/page.js`
- `apps/pm/app/profile/page.js`
- `apps/accounts/app/profile/page.js`
- `apps/crm/lib/rbac.js` / `apps/pm/lib/rbac.js` — `/profile` readable for any authenticated user

## Details

The page shows:

- Avatar initials, display name, email
- Workspace role and organization
- Personal fields (name parts, username, email, user id)
- Workspace access (org, role, access level, member since)

Data comes from `useAuth()` (`user` + `currentOrg`). The page is read-only; there is no settings or edit flow here.

Client portal keeps its own Complete Profile / Settings flows under `apps/client-portal`.

## Usage

Open the avatar menu in CRM, PM, or Accounts and choose **View Profile**, or go to `/profile` in that app.
