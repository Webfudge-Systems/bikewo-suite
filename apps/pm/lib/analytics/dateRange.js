/**
 * Resolve a reports date-range preset to from/to bounds (inclusive end of today).
 * @param {string} preset
 * @returns {{ from: Date|null, to: Date|null, label: string }}
 */
export function resolveReportsDateRange(preset = 'last30') {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === 'all') {
    return { from: null, to: null, label: 'All time' }
  }
  if (preset === 'last7') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'Last 7 days' }
  }
  if (preset === 'last90') {
    const from = new Date(now)
    from.setDate(from.getDate() - 90)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'Last 90 days' }
  }
  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'This month' }
  }
  const from = new Date(now)
  from.setDate(from.getDate() - 30)
  from.setHours(0, 0, 0, 0)
  return { from, to: end, label: 'Last 30 days' }
}

export function inDateRange(dateValue, from, to) {
  if (!from && !to) return true
  if (!dateValue) return false
  const t = new Date(dateValue).getTime()
  if (Number.isNaN(t)) return false
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}
