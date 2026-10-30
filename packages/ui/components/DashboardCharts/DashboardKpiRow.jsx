'use client'

import { KPICard } from '../KPICard'

const DEFAULT_SCHEMES = ['orange', 'orange', 'orange', 'orange', 'orange', 'orange']

/**
 * @param {{ stats: Array<{ title: string, value: string, change?: string, changeType?: string, icon?: import('react').ComponentType }>, columns?: string, showFooterDot?: boolean }} props
 */
export default function DashboardKpiRow({
  stats = [],
  columns = 'md:grid-cols-2 lg:grid-cols-4',
  showFooterDot = true,
}) {
  if (!stats.length) return null
  return (
    <div className={`grid grid-cols-1 gap-4 ${columns}`}>
      {stats.map((stat, index) => (
        <KPICard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          colorScheme={DEFAULT_SCHEMES[index] || 'orange'}
          showFooterDot={stat.showFooterDot ?? showFooterDot}
        />
      ))}
    </div>
  )
}
