import { DEAL_STAGE_OPTIONS } from '../dealFormOptions'
import { resolvePerformanceDateRange } from '../api/teamPerformanceService'

export function normStage(stage) {
  const s = (stage == null ? 'discovery' : String(stage)).trim().toLowerCase()
  if (s === 'closed_won') return 'won'
  if (s === 'closed_lost') return 'lost'
  return s
}

export function isWon(stage) {
  return normStage(stage) === 'won'
}

export function isLost(stage) {
  return normStage(stage) === 'lost'
}

export function isOpenDeal(stage) {
  const s = normStage(stage)
  return s !== 'won' && s !== 'lost'
}

export function dealMoney(d) {
  const n = Number(d?.value)
  return Number.isFinite(n) ? n : 0
}

export function dealProbability(d) {
  const n = Number(d?.probability)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export function weightedValue(d) {
  return (dealMoney(d) * dealProbability(d)) / 100
}

function inRange(dateValue, from, to) {
  if (!dateValue) return false
  const t = new Date(dateValue).getTime()
  if (Number.isNaN(t)) return false
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

function monthLabel(d) {
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/**
 * Aggregate CRM deals/leads/meetings/proposals into reports + forecast series.
 * @param {{ deals?: array, leads?: array, meetings?: array, proposals?: array }} data
 * @param {string} dateRangePreset
 */
export function computeReportsAndForecasts(data, dateRangePreset = 'last30') {
  const deals = Array.isArray(data?.deals) ? data.deals : []
  const leads = Array.isArray(data?.leads) ? data.leads : []
  const meetings = Array.isArray(data?.meetings) ? data.meetings : []
  const proposals = Array.isArray(data?.proposals) ? data.proposals : []

  const { from, to, label: rangeLabel } = resolvePerformanceDateRange(dateRangePreset)
  const now = new Date()

  const dealsInRange = deals.filter((d) =>
    inRange(d.updatedAt || d.createdAt, from, to)
  )

  const wonDeals = deals.filter((d) => isWon(d.stage))
  const lostDeals = deals.filter((d) => isLost(d.stage))
  const openDeals = deals.filter((d) => isOpenDeal(d.stage))

  const wonInRange = wonDeals.filter((d) => inRange(d.updatedAt || d.createdAt, from, to))
  const lostInRange = lostDeals.filter((d) => inRange(d.updatedAt || d.createdAt, from, to))

  const wonRevenue = wonInRange.reduce((s, d) => s + dealMoney(d), 0)
  const pipelineValue = openDeals.reduce((s, d) => s + dealMoney(d), 0)
  const weightedForecast = openDeals.reduce((s, d) => s + weightedValue(d), 0)

  const closedInRange = wonInRange.length + lostInRange.length
  const winRate = closedInRange > 0 ? (wonInRange.length / closedInRange) * 100 : 0
  const conversionRate =
    dealsInRange.length > 0 ? (wonInRange.length / dealsInRange.length) * 100 : 0

  const knownStages = new Set(DEAL_STAGE_OPTIONS.map((o) => o.value))
  const stageBars = DEAL_STAGE_OPTIONS.map(({ value, label }) => ({
    key: value,
    name: label,
    count: deals.filter((d) => {
      let k = normStage(d.stage)
      if (!knownStages.has(k)) k = 'discovery'
      return k === value
    }).length,
  }))

  const MONTHS_BACK = 6
  const revenueTrend = []
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = ref.getFullYear()
    const m = ref.getMonth()
    const start = new Date(y, m, 1, 0, 0, 0, 0)
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
    const revenue = wonDeals.reduce((sum, d) => {
      if (!inRange(d.updatedAt || d.createdAt, start, end)) return sum
      return sum + dealMoney(d)
    }, 0)
    revenueTrend.push({ label: monthLabel(ref), key: monthKey(y, m), revenue })
  }

  // Forecast next 6 months by expectedCloseDate × probability (open deals)
  const FORECAST_MONTHS = 6
  const forecastByMonth = []
  const forecastBuckets = new Map()
  for (let i = 0; i < FORECAST_MONTHS; i++) {
    const ref = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = monthKey(ref.getFullYear(), ref.getMonth())
    forecastBuckets.set(key, {
      label: monthLabel(ref),
      key,
      weighted: 0,
      pipeline: 0,
      count: 0,
    })
  }

  let unscheduledWeighted = 0
  let unscheduledPipeline = 0
  let unscheduledCount = 0

  for (const d of openDeals) {
    const closeRaw = d.expectedCloseDate
    const close = closeRaw ? new Date(closeRaw) : null
    const w = weightedValue(d)
    const v = dealMoney(d)

    if (!close || Number.isNaN(close.getTime())) {
      unscheduledWeighted += w
      unscheduledPipeline += v
      unscheduledCount += 1
      continue
    }

    const key = monthKey(close.getFullYear(), close.getMonth())
    const bucket = forecastBuckets.get(key)
    if (bucket) {
      bucket.weighted += w
      bucket.pipeline += v
      bucket.count += 1
    } else if (close < now) {
      // Overdue close date — attribute to current month
      const currentKey = monthKey(now.getFullYear(), now.getMonth())
      const current = forecastBuckets.get(currentKey)
      if (current) {
        current.weighted += w
        current.pipeline += v
        current.count += 1
      }
    }
  }

  for (const bucket of forecastBuckets.values()) {
    forecastByMonth.push(bucket)
  }

  const winLoss = [
    { name: 'Won', count: wonInRange.length, value: wonRevenue },
    {
      name: 'Lost',
      count: lostInRange.length,
      value: lostInRange.reduce((s, d) => s + dealMoney(d), 0),
    },
  ]

  const funnel = [
    { name: 'Leads', value: leads.length },
    {
      name: 'Qualified',
      value: leads.filter((l) => String(l.status || '').toUpperCase() === 'QUALIFIED').length,
    },
    {
      name: 'Meetings',
      value: meetings.filter((m) => String(m.status || '').toLowerCase() === 'scheduled').length,
    },
    {
      name: 'Proposals',
      value: proposals.filter((p) =>
        ['SENT', 'ACCEPTED'].includes(String(p.status || '').toUpperCase())
      ).length,
    },
    { name: 'Won', value: wonDeals.length },
  ]

  const agingBuckets = [
    { name: '0–7d', count: 0 },
    { name: '8–30d', count: 0 },
    { name: '31–60d', count: 0 },
    { name: '60d+', count: 0 },
  ]
  for (const d of openDeals) {
    const age = Math.floor((now - new Date(d.updatedAt || d.createdAt)) / 86400000)
    if (age <= 7) agingBuckets[0].count += 1
    else if (age <= 30) agingBuckets[1].count += 1
    else if (age <= 60) agingBuckets[2].count += 1
    else agingBuckets[3].count += 1
  }

  const forecastDeals = openDeals
    .map((d) => {
      const closeRaw = d.expectedCloseDate
      const close = closeRaw ? new Date(closeRaw) : null
      const closeValid = close && !Number.isNaN(close.getTime())
      return {
        id: d.id,
        documentId: d.documentId,
        title: d.title || d.name || `Deal #${d.id}`,
        stage: normStage(d.stage),
        value: dealMoney(d),
        probability: dealProbability(d),
        weighted: weightedValue(d),
        expectedCloseDate: closeValid ? close.toISOString().slice(0, 10) : null,
        overdue: closeValid ? close < now : false,
      }
    })
    .sort((a, b) => {
      if (!a.expectedCloseDate && !b.expectedCloseDate) return b.weighted - a.weighted
      if (!a.expectedCloseDate) return 1
      if (!b.expectedCloseDate) return -1
      return a.expectedCloseDate.localeCompare(b.expectedCloseDate)
    })

  return {
    rangeLabel,
    kpis: {
      wonRevenue,
      weightedForecast,
      pipelineValue,
      winRate,
      conversionRate,
      openDealCount: openDeals.length,
      wonCount: wonInRange.length,
      lostCount: lostInRange.length,
    },
    revenueTrend,
    forecastByMonth,
    unscheduled: {
      weighted: unscheduledWeighted,
      pipeline: unscheduledPipeline,
      count: unscheduledCount,
    },
    winLoss,
    stageBars,
    funnel,
    agingBuckets,
    forecastDeals,
  }
}
