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
  FolderOpen,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  PieChart,
  Flag,
  Users,
  TrendingUp,
  Building2,
  ListTodo,
} from 'lucide-react'
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
  EmptyState,
} from '@webfudge/ui'
import projectService from '../../lib/api/projectService'
import taskService from '../../lib/api/taskService'
import { transformTask, transformProject } from '../../lib/api/dataTransformers'
import { filterMajorTasks } from '../../lib/taskListUtils'
import { canReadPM } from '../../lib/rbac'
import { computePmReports } from '../../lib/analytics/pmReportsCompute'

const ACCENT = DASHBOARD_CHART_ACCENT || '#ea580c'
const DONE_COLOR = '#10B981'
const CREATED_COLOR = '#3B82F6'

const DATE_RANGE_OPTIONS = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'all', label: 'All time' },
]

export default function PmReportsView({ dateRange, onDateRangeChange }) {
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState({ tasks: [], projects: [] })
  const [loadError, setLoadError] = useState(null)

  const canViewTasks = canReadPM('tasks') || canReadPM('my_tasks')
  const canViewProjects = canReadPM('projects')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const [tasksRes, projectsRes] = await Promise.allSettled([
          canViewTasks
            ? taskService.fetchAllTasks({ pageSize: 500, sort: 'updatedAt:desc' })
            : Promise.resolve([]),
          canViewProjects
            ? projectService.getAllProjects({ pageSize: 500, sort: 'updatedAt:desc' })
            : Promise.resolve({ data: [] }),
        ])

        if (cancelled) return

        let tasks = []
        if (tasksRes.status === 'fulfilled') {
          const rows = Array.isArray(tasksRes.value)
            ? tasksRes.value
            : tasksRes.value?.data || []
          tasks = filterMajorTasks(rows.map(transformTask).filter(Boolean))
        }

        let projects = []
        if (projectsRes.status === 'fulfilled') {
          const rows = projectsRes.value?.data || projectsRes.value || []
          projects = (Array.isArray(rows) ? rows : []).map(transformProject).filter(Boolean)
        }

        setRaw({ tasks, projects })
        if (tasksRes.status === 'rejected' && projectsRes.status === 'rejected') {
          setLoadError('Could not load report data. Try refreshing the page.')
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.message || 'Failed to load reports')
          setRaw({ tasks: [], projects: [] })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canViewTasks, canViewProjects])

  const report = useMemo(() => computePmReports(raw, dateRange), [raw, dateRange])

  const stats = [
    {
      title: 'Projects',
      value: loading ? '—' : String(report.kpis.projects),
      change: loading ? '0' : report.rangeLabel,
      changeType: 'increase',
      icon: FolderOpen,
    },
    {
      title: 'Tasks',
      value: loading ? '—' : String(report.kpis.tasks),
      change: loading ? '0' : `${report.kpis.todo} to do`,
      changeType: 'increase',
      icon: CheckSquare,
    },
    {
      title: 'Completed',
      value: loading ? '—' : String(report.kpis.completed),
      change: loading ? '0' : `${report.kpis.completionRate}% rate`,
      changeType: 'increase',
      icon: CheckCircle2,
    },
    {
      title: 'Overdue',
      value: loading ? '—' : String(report.kpis.overdue),
      change: loading ? '0' : `${report.kpis.inProgress} in progress`,
      changeType: report.kpis.overdue > 0 ? 'decrease' : 'increase',
      icon: AlertCircle,
    },
  ]

  const hasStatus = report.statusBars.some((r) => r.count > 0)
  const hasPriority = report.priorityBars.some((r) => r.count > 0)
  const hasByProject = report.byProject.some((r) => r.total > 0)
  const hasByAssignee = report.byAssignee.some((r) => r.count > 0)
  const hasActivity = report.activityTrend.some((r) => r.created > 0 || r.completed > 0)
  const hasProjectStatus = report.projectStatusBars.some((r) => r.count > 0)

  if (!canViewTasks && !canViewProjects) {
    return (
      <EmptyState
        icon={PieChart}
        title="Reports unavailable"
        description="Your role does not have access to tasks or projects for reporting."
        className="py-16"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing metrics for{' '}
          <span className="font-medium text-gray-900">{report.rangeLabel}</span>
          {!loading && report.hasTasks ? (
            <span className="text-gray-500">
              {' '}
              · {report.kpis.tasks} task{report.kpis.tasks === 1 ? '' : 's'}
              {report.hasProjects
                ? ` · ${report.kpis.projects} project${report.kpis.projects === 1 ? '' : 's'}`
                : ''}
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

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {loadError}
        </div>
      ) : null}

      <DashboardKpiRow stats={stats} showFooterDot={false} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChartPanel
          title="Tasks by status"
          subtitle={`Distribution in ${report.rangeLabel.toLowerCase()}`}
          icon={ListTodo}
          loading={loading}
          brandChart
        >
          {!loading && !hasStatus ? (
            <DashboardChartEmpty message="No tasks in this range yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart
                layout="vertical"
                data={report.statusBars}
                margin={{ left: 0, right: 8, top: 2, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `task${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" name="Tasks" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {report.statusBars.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Tasks by priority"
          subtitle="High · Medium · Low"
          icon={Flag}
          loading={loading}
          brandChart
        >
          {!loading && !hasPriority ? (
            <DashboardChartEmpty message="No priority data in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart data={report.priorityBars} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `task${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {report.priorityBars.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChartPanel
          title="Tasks by project"
          subtitle="Top projects by task volume"
          icon={FolderOpen}
          loading={loading}
          brandChart
        >
          {!loading && !hasByProject ? (
            <DashboardChartEmpty message="No project-linked tasks in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart
                layout="vertical"
                data={report.byProject}
                margin={{ left: 0, right: 8, top: 2, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 10, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `task${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="completed"
                  name="Done"
                  stackId="a"
                  fill={DONE_COLOR}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="open"
                  name="Open"
                  stackId="a"
                  fill={ACCENT}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Tasks by assignee"
          subtitle="Workload across team members"
          icon={Users}
          loading={loading}
          brandChart
        >
          {!loading && !hasByAssignee ? (
            <DashboardChartEmpty message="No assignee data in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart
                layout="vertical"
                data={report.byAssignee}
                margin={{ left: 0, right: 8, top: 2, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 10, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `task${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" name="Tasks" fill={ACCENT} radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChartPanel
          title="Task activity"
          subtitle="Created vs completed over recent days"
          icon={TrendingUp}
          loading={loading}
          brandChart
        >
          {!loading && !hasActivity ? (
            <DashboardChartEmpty message="No create or complete activity in this window." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <AreaChart
                data={report.activityTrend}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="pmReportsCreatedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CREATED_COLOR} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CREATED_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="pmReportsDoneFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={DONE_COLOR} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={DONE_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={28} />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `task${v === 1 ? '' : 's'}`} />
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke={CREATED_COLOR}
                  strokeWidth={2}
                  fill="url(#pmReportsCreatedFill)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke={DONE_COLOR}
                  strokeWidth={2}
                  fill="url(#pmReportsDoneFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>

        <DashboardChartPanel
          title="Projects by status"
          subtitle={`Project portfolio in ${report.rangeLabel.toLowerCase()}`}
          icon={Building2}
          loading={loading}
          brandChart
        >
          {!loading && !hasProjectStatus ? (
            <DashboardChartEmpty message="No projects in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <BarChart
                data={report.projectStatusBars}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip
                  content={
                    <DashboardBarTooltip unit={(v) => `project${v === 1 ? '' : 's'}`} />
                  }
                  cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
                />
                <Bar dataKey="count" name="Projects" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {report.projectStatusBars.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardChartPanel>
      </div>

      <Card className="overflow-hidden border border-gray-200 p-0 shadow-md">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overdue tasks</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              Open tasks past due in {report.rangeLabel.toLowerCase()} — oldest first
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50">
            <Clock className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-100" />
            ))}
          </div>
        ) : report.overdueList.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No overdue tasks in this range. Nice work.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Task
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Project
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Assignees
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Due date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {report.overdueList.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2.5">
                      <Link
                        href={task.href}
                        className="font-medium text-brand-foreground hover:underline"
                      >
                        <TableCellText>{task.title}</TableCellText>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {task.projectSlug ? (
                        <Link
                          href={`/projects/${task.projectSlug}`}
                          className="hover:underline"
                        >
                          {task.project}
                        </Link>
                      ) : (
                        task.project
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{task.assignees}</td>
                    <td className="px-4 py-2.5 text-rose-600">
                      <TableCellCreated
                        dateString={task.dueDate}
                        dateMode="calendar"
                        showRelative={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.kpis.overdue > report.overdueList.length ? (
              <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                Showing {report.overdueList.length} of {report.kpis.overdue} overdue tasks.{' '}
                <Link href="/my-tasks" className="font-medium text-brand-foreground hover:underline">
                  View My Tasks
                </Link>
              </p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  )
}
