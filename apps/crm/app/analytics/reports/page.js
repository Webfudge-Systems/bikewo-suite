'use client'

import { useState } from 'react'
import CRMPageHeader from '../../../components/CRMPageHeader'
import ReportsForecastsView from '../../../components/analytics/ReportsForecastsView'

export default function ReportsForecastsPage() {
  const [dateRange, setDateRange] = useState('last30')

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Reports & Forecasts"
        subtitle="Sales performance, conversion, and revenue forecasting"
        breadcrumb={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Reports & Forecasts', href: '/analytics/reports' },
        ]}
      />
      <ReportsForecastsView dateRange={dateRange} onDateRangeChange={setDateRange} />
    </div>
  )
}
