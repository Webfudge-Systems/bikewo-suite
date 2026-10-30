import { resolveReportsDateRange, inDateRange } from './dateRange'

const STATUS_ORDER = [
  { key: 'SCHEDULED', name: 'To Do', fill: '#FF7A00' },
  { key: 'IN_PROGRESS', name: 'In Progress', fill: '#3B82F6' },
  { key: 'INTERNAL_REVIEW', name: 'Internal Review', fill: '#8B5CF6' },
  { key: 'ON_HOLD', name: 'On Hold', fill: '#94A3B8' },
  { key: 'COMPLETED', name: 'Done', fill: '#10B981' },
  { key: 'CANCELLED', name: 'Cancelled', fill: '#64748B' },
]

const PRIORITY_ORDER = [
  { key: 'HIGH', name: 'High', fill: '#EF4444' },
  { key: 'MEDIUM', name: 'Medium', fill: '#F59E0B' },
  { key: 'LOW', name: 'Low', fill: '#94A3B8' },
]

const PROJECT_STATUS_ORDER = [
  { key: 'PLANNING', name: 'Planning', fill: '#94A3B8' },
  { key: 'ACTIVE', name: 'Active', fill: '#3B82F6' },
  { key: 'IN_PROGRESS', name: 'In Progress', fill: '#FF7A00' },
  { key: 'ON_HOLD', name: 'On Hold', fill: '#F59E0B' },
  { key: 'COMPLETED', name: 'Completed', fill: '#10B981' },
  { key: 'CANCELLED', name: 'Cancelled', fill: '#64748B' },
]

function isCompleted(task) {
  return task?.strapiStatus === 'COMPLETED'
}

function isCancelled(task) {
  return task?.strapiStatus === 'CANCELLED'
}

function isOverdue(task, now = new Date()) {
  if (!task?.dueDate || isCompleted(task) || isCancelled(task)) return false
  const due = new Date(task.dueDate)
  if (Number.isNaN(due.getTime())) return false
  return due < now
}

function taskActivityDate(task) {
  return task?.updatedAt || task?.createdAt || null
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameCalendarDay(isoDate, dayStart) {
  if (!isoDate) return false
  const t = new Date(isoDate)
  if (Number.isNaN(t.getTime())) return false
  return startOfDay(t).getTime() === dayStart.getTime()
}

function activityDayCount(preset) {
  if (preset === 'last7') return 7
  if (preset === 'last90') return 30
  if (preset === 'thisMonth') {
    return Math.max(1, new Date().getDate())
  }
  if (preset === 'all') return 30
  return 14
}

/**
 * Aggregate PM tasks + projects into reports series.
 * @param {{ tasks?: array, projects?: array }} data
 * @param {string} dateRangePreset
 */
export function computePmReports(data, dateRangePreset = 'last30') {
  const allTasks = Array.isArray(data?.tasks) ? data.tasks : []
  const allProjects = Array.isArray(data?.projects) ? data.projects : []
  const { from, to, label: rangeLabel } = resolveReportsDateRange(dateRangePreset)
  const now = new Date()

  const tasksInRange = allTasks.filter((t) => inDateRange(taskActivityDate(t), from, to))
  const projectsInRange = allProjects.filter((p) =>
    inDateRange(p.updatedAt || p.createdAt, from, to)
  )

  const completed = tasksInRange.filter(isCompleted).length
  const inProgress = tasksInRange.filter((t) => t.strapiStatus === 'IN_PROGRESS').length
  const todo = tasksInRange.filter((t) => t.strapiStatus === 'SCHEDULED').length
  const overdue = tasksInRange.filter((t) => isOverdue(t, now)).length
  const openLike = tasksInRange.filter((t) => !isCancelled(t)).length
  const completionRate = openLike > 0 ? Math.round((completed / openLike) * 1000) / 10 : 0

  const statusBars = STATUS_ORDER.map((row) => ({
    ...row,
    count: tasksInRange.filter((t) => t.strapiStatus === row.key).length,
  })).filter((row) => row.count > 0 || ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(row.key))

  const priorityBars = PRIORITY_ORDER.map((row) => ({
    ...row,
    count: tasksInRange.filter((t) => {
      const p = String(t.strapiPriority || t.priority || 'MEDIUM').toUpperCase()
      return p === row.key
    }).length,
  }))

  const projectStatusBars = PROJECT_STATUS_ORDER.map((row) => ({
    ...row,
    count: projectsInRange.filter((p) => p.strapiStatus === row.key).length,
  })).filter((row) => row.count > 0 || ['PLANNING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(row.key))

  const byProjectMap = new Map()
  for (const task of tasksInRange) {
    const name = task.project || 'Unassigned'
    const key = task.projectId != null ? String(task.projectId) : name
    if (!byProjectMap.has(key)) {
      byProjectMap.set(key, {
        key,
        name,
        total: 0,
        completed: 0,
        open: 0,
        overdue: 0,
      })
    }
    const bucket = byProjectMap.get(key)
    bucket.total += 1
    if (isCompleted(task)) bucket.completed += 1
    else if (!isCancelled(task)) bucket.open += 1
    if (isOverdue(task, now)) bucket.overdue += 1
  }

  const byProject = [...byProjectMap.values()]
    .map((row) => ({
      ...row,
      percent: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  const byAssigneeMap = new Map()
  for (const task of tasksInRange) {
    if (isCancelled(task)) continue
    const assignees = Array.isArray(task.assignees) ? task.assignees : []
    if (assignees.length === 0) {
      const key = 'unassigned'
      const prev = byAssigneeMap.get(key) || { key, name: 'Unassigned', count: 0, open: 0, done: 0 }
      prev.count += 1
      if (isCompleted(task)) prev.done += 1
      else prev.open += 1
      byAssigneeMap.set(key, prev)
      continue
    }
    const seen = new Set()
    for (const member of assignees) {
      if (member?.id == null || seen.has(member.id)) continue
      seen.add(member.id)
      const key = String(member.id)
      const prev = byAssigneeMap.get(key) || {
        key,
        name: member.name || 'Unknown',
        count: 0,
        open: 0,
        done: 0,
      }
      prev.count += 1
      if (isCompleted(task)) prev.done += 1
      else prev.open += 1
      byAssigneeMap.set(key, prev)
    }
  }

  const byAssignee = [...byAssigneeMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const days = activityDayCount(dateRangePreset)
  const today = startOfDay(now)
  const activityTrend = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    let created = 0
    let completedCount = 0
    for (const task of allTasks) {
      if (sameCalendarDay(task.createdAt, day)) created += 1
      if (isCompleted(task) && sameCalendarDay(task.updatedAt || task.createdAt, day)) {
        completedCount += 1
      }
    }
    activityTrend.push({
      label:
        days > 14
          ? day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      created,
      completed: completedCount,
    })
  }

  const overdueList = tasksInRange
    .filter((t) => isOverdue(t, now))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 25)
    .map((t) => ({
      id: t.id,
      documentId: t.documentId,
      title: t.name || t.title || 'Untitled task',
      project: t.project || '—',
      projectSlug: t.projectSlug || null,
      dueDate: t.dueDate,
      status: t.status || t.strapiStatus,
      href: t.id != null ? `/tasks/${t.id}` : '/my-tasks',
      assignees: (t.assignees || []).map((a) => a.name).filter(Boolean).join(', ') || 'Unassigned',
    }))

  return {
    rangeLabel,
    kpis: {
      projects: projectsInRange.length,
      tasks: tasksInRange.length,
      completed,
      inProgress,
      todo,
      overdue,
      completionRate,
    },
    statusBars,
    priorityBars,
    projectStatusBars,
    byProject,
    byAssignee,
    activityTrend,
    overdueList,
    hasTasks: tasksInRange.length > 0,
    hasProjects: projectsInRange.length > 0,
  }
}
