'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  DollarSign,
  Target,
  TrendingUp,
  Percent,
  Filter,
  Clock,
  CalendarRange,
  BarChart3,
} from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import {
  DashboardKpiRow,
  DashboardChartPanel,
  DashboardChartEmpty,
  DASHBOARD_CHART_ACCENT,
  DashboardBarTooltip,
  DASHBOARD_BAR_TOOLTIP_CURSOR,
  Select,
  Card,
  TableCellText,
  TableCellCreated,
} from '@webfudge/ui'
import { fetchSalesDashboardData } from '../../lib/api/dashboardDataService'
import { computeReportsAndForecasts } from '../../lib/analytics/reportsCompute'
import { DEAL_STAGE_OPTIONS } from '../../lib/dealFormOptions'

const ACCENT = DASHBOARD_CHART_ACCENT || '#2AB77C'
const LOST_COLOR = '#c2410c'

const DATE_RANGE_OPTIONS = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'all', label: 'All time' },
]

const STAGE_LABEL = Object.fromEntries(DEAL_STAGE_OPTIONS.map((o) => [o.value, o.label]))

function formatChange(rate) {
  if (rate == null || Number.isNaN(rate)) return '—'
  return `${rate.toFixed(1)}%`
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-gray-600">
          {p.name}: {formatCurrency(p.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

function funnelUnit(_value, row) {
  const n = String(row?.name ?? '').toLowerCase()
  if (n === 'won') return 'won deal' + (_value === 1 ? '' : 's')
  if (n === 'meetings') return 'scheduled meeting' + (_value === 1 ? '' : 's')
  if (n === 'proposals') return 'active proposal' + (_value === 1 ? '' : 's')
  if (n === 'qualified') return 'qualified lead' + (_value === 1 ? '' : 's')
  return 'lead' + (_value === 1 ? '' : 's')
}

function dealHref(deal) {
  const id = deal.documentId || deal.id
  return id ? `/sales/deals/${id}` : '/sales/deals'
}

export default function ReportsForecastsView({ dateRange, onDateRangeChange }) {
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState({
    deals: [],
    leads: [],
    meetings: [],
    proposals: [],
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchSalesDashboardData()
      if (!cancelled) {
        setRaw(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const report = useMemo(
    () => computeReportsAndForecasts(raw, dateRange),
    [raw, dateRange]
  )

  const stats = [
    {
      title: 'Won revenue',
      value: loading ? '—' : formatCurrency(report.kpis.wonRevenue, { notation: 'compact' }),
      change: loading ? '0' : `${report.kpis.wonCount} won`,
      changeType: 'increase',
      icon: DollarSign,
    },
    {
      title: 'Weighted forecast',
      value: loading
        ? '—'
        : formatCurrency(report.kpis.weightedForecast, { notation: 'compact' }),
      change: loading ? '0' : `${report.kpis.openDealCount} open`,
      changeType: 'increase',
      icon: TrendingUp,
    },
    {
      title: 'Pipeline value',
      value: loading
        ? '—'
        : formatCurrency(report.kpis.pipelineValue, { notation: 'compact' }),
      change: loading ? '0' : `${report.kpis.openDealCount} deals`,
      changeType: 'increase',
      icon: Target,
    },
    {
      title: 'Win rate',
      value: loading ? '—' : formatChange(report.kpis.winRate),
      change: loading ? '0' : `${report.kpis.wonCount}W / ${report.kpis.lostCount}L`,
      changeType: report.kpis.winRate >= 50 ? 'increase' : 'decrease',
      icon: Percent,
    },
  ]

  const hasRevenue = report.revenueTrend.some((r) => r.revenue > 0)
  const hasForecast = report.forecastByMonth.some((r) => r.weighted > 0 || r.pipeline > 0)
  const hasWinLoss = report.winLoss.some((r) => r.count > 0)
  const hasStages = report.stageBars.some((r) => r.count > 0)
  const hasFunnel = report.funnel.some((f) => f.value > 0)
  const hasAging = report.agingBuckets.some((b) => b.count > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing metrics for <span className="font-medium text-gray-900">{report.rangeLabel}</span>
          {report.unscheduled.count > 0 ? (
            <span className="text-gray-500">
              {' '}
              · {report.unscheduled.count} open deal
              {report.unscheduled.count === 1 ? '' : 's'} without a close date (
              {formatCurrency(report.unscheduled.weighted, { notation: 'compact' })} weighted)
            </span>
          ) : null}
        </p>
        <div className="w-full sm:w-48">
          <Select
            value={dateRange}
            onChange={(value) => onDateRangeChange?.(value)}
            options={DATE_RANGE_OPTIONS}
            allowEmpty={false}
            searchable={false}
            aria-label="Date range"
          />
        </div>
      </div>

      <DashboardKpiRow stats={stats} showFooterDot={false} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChartPanel
          title="Revenue trend"
          subtitle="Won deal value by month (by last update)"
          icon={TrendingUp}
          loading={loading}
          brandChart
        >
          {!loading && !hasRevenue ? (
            <DashboardChartEmpty message="No won revenue in the last six months." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <AreaChart data={report.revenueTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={52}
                  tickFormatter={(v) =>
                    formatCurrency(Number(v), {
                      notation: 'compact',
                      maximumFractionDigits: v >= 100000 ? 0 : 1,
                    })
                  }
                />
                <Tooltip content={<MoneyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#reportsRevFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Revenue forecast"
          subtitle="Open deals by expected close × win probability"
          icon={CalendarRange}
          loading={loading}
          brandChart
        >
          {!loading && !hasForecast ? (
            <DashboardChartEmpty message="No forecast data. Set expected close dates and probabilities on open deals." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={report.forecastByMonth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={52}
                  tickFormatter={(v) =>
                    formatCurrency(Number(v), {
                      notation: 'compact',
                      maximumFractionDigits: v >= 100000 ? 0 : 1,
                    })
                  }
                />
                <Tooltip content={<MoneyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pipeline" name="Pipeline" fill="#fdba74" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="weighted" name="Weighted" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChartPanel
          title="Win / loss"
          subtitle={`Closed deals in ${report.rangeLabel.toLowerCase()}`}
          icon={BarChart3}
          loading={loading}
          brandChart
        >
          {!loading && !hasWinLoss ? (
            <DashboardChartEmpty message="No closed deals in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={report.winLoss} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  content={
                    <DashboardBarTooltip
                      unit={(v) => `deal${v === 1 ? '' : 's'}`}
                    />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" name="Deals" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {report.winLoss.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === 'Won' ? ACCENT : LOST_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Deals by stage"
          subtitle="Current pipeline distribution"
          icon={Filter}
          loading={loading}
          brandChart
        >
          {!loading && !hasStages ? (
            <DashboardChartEmpty message="No deals yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart
                layout="vertical"
                data={report.stageBars}
                margin={{ left: 0, right: 8, top: 2, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={82}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `deal${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
        <DashboardChartPanel
          title="Sales funnel"
          subtitle="Leads → Qualified → Meetings → Proposals → Won"
          icon={Filter}
          loading={loading}
          fullHeight
          brandChart
        >
          {!loading && !hasFunnel ? (
            <DashboardChartEmpty message="No funnel data yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={report.funnel} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  content={<DashboardBarTooltip unit={funnelUnit} />}
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="value" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Pipeline aging"
          subtitle="Open deals by days since last update"
          icon={Clock}
          loading={loading}
          fullHeight
          brandChart
        >
          {!loading && !hasAging ? (
            <DashboardChartEmpty message="No open deals in pipeline." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={report.agingBuckets} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `open deal${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" fill={LOST_COLOR} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <Card className="overflow-hidden border border-gray-200 p-0 shadow-md">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Forecast pipeline</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              Open deals ranked by expected close — weighted = value × probability
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50">
            <CalendarRange className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-100" />
            ))}
          </div>
        ) : report.forecastDeals.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No open deals. Create deals with value, probability, and expected close date to build a
            forecast.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Deal
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Stage
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-gray-700">
                    Value
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-gray-700">
                    Prob.
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-gray-700">
                    Weighted
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Close date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {report.forecastDeals.slice(0, 25).map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2.5">
                      <Link
                        href={dealHref(deal)}
                        className="font-medium text-brand-foreground hover:underline"
                      >
                        <TableCellText>{deal.title}</TableCellText>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {STAGE_LABEL[deal.stage] || deal.stage}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                      {formatCurrency(deal.value, { notation: 'compact' })}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                      {deal.probability}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">
                      {formatCurrency(deal.weighted, { notation: 'compact' })}
                    </td>
                    <td className="px-4 py-2.5">
                      {deal.expectedCloseDate ? (
                        <span className={deal.overdue ? 'text-rose-600' : 'text-gray-700'}>
                          <TableCellCreated
                            dateString={deal.expectedCloseDate}
                            dateMode="calendar"
                            showRelative={false}
                          />
                          {deal.overdue ? (
                            <span className="ml-1.5 text-xs font-medium">Overdue</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.forecastDeals.length > 25 ? (
              <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                Showing 25 of {report.forecastDeals.length} open deals.{' '}
                <Link href="/sales/deals" className="font-medium text-brand-foreground hover:underline">
                  View all deals
                </Link>
              </p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  )
}
