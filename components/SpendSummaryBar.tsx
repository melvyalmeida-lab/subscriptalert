'use client'

import type { SpendSummary } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Calendar, Package } from 'lucide-react'

interface Props {
  summary: SpendSummary
}

export default function SpendSummaryBar({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up">
      <div className="card p-5">
        <div className="flex items-center gap-2 text-ink-muted text-xs font-display font-semibold uppercase tracking-wider mb-2">
          <TrendingUp size={12} />
          Monthly spend
        </div>
        <div className="font-display font-black text-3xl text-ink tracking-tight">
          {formatCurrency(summary.monthlyTotal)}
        </div>
        <div className="text-ink-muted text-xs font-body mt-1">
          {formatCurrency(summary.yearlyTotal)} / year
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-ink-muted text-xs font-display font-semibold uppercase tracking-wider mb-2">
          <Package size={12} />
          Active subscriptions
        </div>
        <div className="font-display font-black text-3xl text-ink tracking-tight">
          {summary.activeCount}
        </div>
        <div className="text-ink-muted text-xs font-body mt-1">
          services tracked
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-ink-muted text-xs font-display font-semibold uppercase tracking-wider mb-2">
          <Calendar size={12} />
          Renewing this week
        </div>
        <div className={`font-display font-black text-3xl tracking-tight ${
          summary.upcomingRenewals.length > 0 ? 'text-signal' : 'text-ink'
        }`}>
          {summary.upcomingRenewals.length}
        </div>
        <div className="text-ink-muted text-xs font-body mt-1">
          {summary.upcomingRenewals.length > 0
            ? `${formatCurrency(summary.upcomingRenewals.reduce((s, r) => s + r.amount, 0))} due`
            : 'nothing due'}
        </div>
      </div>
    </div>
  )
}
