'use client'

import { Bell } from 'lucide-react'
import type { Subscription } from '@/lib/types'
import { getDaysUntilRenewal, formatCurrency, formatRenewalDate } from '@/lib/utils'

interface Props {
  renewals: Subscription[]
}

export default function UpcomingRenewals({ renewals }: Props) {
  if (!renewals.length) return null

  return (
    <div className="mb-8 bg-signal-pale border border-signal/20 rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={14} className="text-signal" />
        <span className="font-display font-bold text-sm text-signal uppercase tracking-wide">
          Renewing soon
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {renewals.map(sub => {
          const days = getDaysUntilRenewal(sub.nextRenewalDate)
          return (
            <div key={sub.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-sm">
              <div>
                <div className="font-display font-bold text-sm text-ink">{sub.name}</div>
                <div className="text-ink-muted text-xs font-body">
                  {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                  {' · '}
                  {formatCurrency(sub.amount, sub.currency)}
                </div>
              </div>
              <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                days <= 1 ? 'bg-signal text-white' : 'bg-warn-pale text-warn'
              }`}>
                {days === 0 ? 'TODAY' : `${days}d`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
