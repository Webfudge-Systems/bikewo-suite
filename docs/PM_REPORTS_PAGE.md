# PM Reports Page

## Summary

Shipped a full **Reports** experience in PM at `/analytics`, replacing the coming-soon placeholder. The page mirrors CRM Reports patterns (date filter, KPI row, Recharts panels, overdue table) with project/task aggregations.

## Scope

- `apps/pm/app/analytics/page.js` — Reports page shell + RBAC
- `apps/pm/components/analytics/PmReportsView.jsx` — data load + charts/table
- `apps/pm/lib/analytics/pmReportsCompute.js` — client-side aggregations
- `apps/pm/lib/analytics/dateRange.js` — date-range presets
- `apps/pm/components/PMSidebar.jsx` — Workspace tools → Reports → `/analytics`
- `apps/pm/package.json` — `recharts` dependency

## Details

### KPIs

Projects · Tasks · Completed (with completion %) · Overdue — filtered by selected date range (task/project `updatedAt` / `createdAt`).

### Charts

1. Tasks by status (horizontal bars)
2. Tasks by priority
3. Tasks by project (stacked Done / Open)
4. Tasks by assignee
5. Task activity (created vs completed area)
6. Projects by status

### Table

Overdue tasks (oldest first), links to task detail and project.

### Date presets

Last 7 / 30 / 90 days · This month · All time

## Usage

1. Open PM → **Workspace tools** → **Reports** (requires `analytics` read).
2. Change the date range to refresh computed metrics (no extra API call).
3. Drill into overdue rows via task/project links.
