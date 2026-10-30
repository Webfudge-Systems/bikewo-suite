'use client'

import { useState } from 'react'
import { EmptyState } from '@webfudge/ui'
import { PieChart } from 'lucide-react'
import PMPageHeader from '../../components/PMPageHeader'
import PmReportsView from '../../components/analytics/PmReportsView'
import { canReadPM } from '../../lib/rbac'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last30')
  const canView = canReadPM('analytics')

  if (!canView) {
    return (
      <div className="min-h-full bg-white p-8">
        <EmptyState
          icon={PieChart}
          title="Reports unavailable"
          description="Your current role does not have read access to PM analytics and reports."
        />
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-white p-4 md:p-6">
      <PMPageHeader
        title="Reports"
        subtitle="Project and task performance overview"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reports', href: '/analytics' },
        ]}
      />
      <PmReportsView dateRange={dateRange} onDateRangeChange={setDateRange} />
    </div>
  )
}
