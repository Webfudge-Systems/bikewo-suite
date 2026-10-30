# CRM Reports & Forecasts Update

## Summary

Replaced the Analytics **Reports & Forecasts** coming-soon placeholder with a full page at `/analytics/reports`. The page aggregates live CRM deals, leads, meetings, and proposals client-side (same data path as the Sales dashboard) and adds weighted revenue forecasting from deal `value`, `probability`, and `expectedCloseDate`.

## Scope

- App: `apps/crm`
- Route: `/analytics/reports`
- Key files:
  - `apps/crm/app/analytics/reports/page.js`
  - `apps/crm/components/analytics/ReportsForecastsView.jsx`
  - `apps/crm/lib/analytics/reportsCompute.js`
  - Nav: `apps/crm/lib/navigation.js`, `apps/crm/components/CRMSidebar.jsx`
  - Hub link: `apps/crm/app/analytics/page.js`

## Details

### Page contents

1. **Date range** — Last 7 / 30 / 90 days, this month, or all time (reuses `resolvePerformanceDateRange`).
2. **KPIs** — Won revenue, weighted forecast, pipeline value, win rate (range-scoped for closed metrics).
3. **Charts**
   - Revenue trend (6-month won value)
   - Revenue forecast (next 6 months: pipeline vs weighted)
   - Win / loss counts in selected range
   - Deals by stage
   - Sales funnel + pipeline aging
4. **Forecast pipeline table** — Open deals with value, probability, weighted amount, and close date (overdue highlighted). Links through to deal detail.

### Forecast formula

- **Weighted** = `deal.value × (probability / 100)` for open deals
- Months bucketed by `expectedCloseDate`; overdue closes roll into the current month
- Deals without a close date are called out in the range summary (not dropped from total weighted KPI)

### Navigation

| Entry | Before | After |
| --- | --- | --- |
| Sidebar → Analytics → Reports & Forecasts | `/coming-soon?feature=Analytics` | `/analytics/reports` |
| Analytics Overview → Open reports | coming soon | `/analytics/reports` |

**Pipeline analytics** on the Overview hub remains coming soon.

## Usage

1. Open CRM → **Analytics** (System section) → **Reports & Forecasts**, or Overview → **Open reports**.
2. Pick a date range to filter won/lost metrics.
3. Keep deal **value**, **probability**, and **expected close date** filled so the forecast chart and table stay useful.

No new backend endpoints were added; aggregation uses `fetchSalesDashboardData()`.
