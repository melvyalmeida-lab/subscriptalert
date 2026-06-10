'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, PauseCircle, CheckCircle, Edit2 } from 'lucide-react'
import type { Subscription } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import {
  getDaysUntilRenewal,
  getRenewalUrgency,
  formatRenewalDate,
  formatCurrency,
  updateSubscription,
  deleteSubscription,
  CYCLE_LABELS,
} from '@/lib/utils'
import clsx from 'clsx'

interface Props {
  subscription: Subscription
  className?: string
  onUpdate: (updated: Subscription[]) => void
}

export default function SubscriptionCard({ subscription: sub, className, onUpdate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const days = getDaysUntilRenewal(sub.nextRenewalDate)
  const urgency = getRenewalUrgency(days)
  const meta = CATEGORY_META[sub.category]

  function handleDelete() {
    if (confirm(`Remove ${sub.name}?`)) {
      const updated = deleteSubscription(sub.id)
      onUpdate(updated)
    }
    setMenuOpen(false)
  }

  function handleToggleStatus() {
    const newStatus = sub.status === 'active' ? 'paused' : 'active'
    const updated = updateSubscription(sub.id, { status: newStatus })
    onUpdate(updated)
    setMenuOpen(false)
  }

  const urgencyBadge = {
    overdue: 'badge-urgent',
    urgent: 'badge-urgent',
    soon: 'badge-soon',
    ok: 'badge-ok',
  }[urgency]

  const daysLabel = days < 0
    ? 'Overdue'
    : days === 0 ? 'Today'
    : days === 1 ? 'Tomorrow'
    : `${days} days`

  return (
    <div
      className={clsx(
        'card p-5 relative group hover:shadow-md transition-all duration-200 opacity-0',
        sub.status === 'paused' && 'opacity-60',
        sub.status === 'cancelled' && 'opacity-40',
        className
      )}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Top row: logo + name + menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Category icon / color badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${meta.color}18` }}
          >
            {meta.icon}
          </div>
          <div>
            <div className="font-display font-bold text-ink text-sm leading-tight">{sub.name}</div>
            <div className="text-ink-muted text-xs font-body mt-0.5">{meta.label}</div>
          </div>
        </div>

        {/* Context menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-paper-warm
            opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-paper-warm z-20 py-1 min-w-[140px]">
                <button
                  onClick={handleToggleStatus}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-body text-ink hover:bg-paper-warm transition-colors"
                >
                  {sub.status === 'active' ? (
                    <><PauseCircle size={12} /> Pause</>
                  ) : (
                    <><CheckCircle size={12} /> Set active</>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-body text-signal hover:bg-signal-pale transition-colors"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <span className="font-display font-black text-2xl text-ink">
          {formatCurrency(sub.amount, sub.currency)}
        </span>
        <span className="text-ink-muted text-xs font-body ml-1.5">
          / {CYCLE_LABELS[sub.billingCycle].toLowerCase()}
        </span>
      </div>

      {/* Renewal info */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-ink-muted font-body">
          {sub.status === 'cancelled' ? 'Cancelled' : `Renews ${formatRenewalDate(sub.nextRenewalDate)}`}
        </div>

        {sub.status === 'active' && (
          <span className={urgencyBadge}>
            {daysLabel}
          </span>
        )}

        {sub.status === 'paused' && (
          <span className="badge-ok">Paused</span>
        )}

        {sub.status === 'trial' && (
          <span className="badge-soon">Trial · {daysLabel}</span>
        )}
      </div>

      {/* Left border accent for urgency */}
      {sub.status === 'active' && (urgency === 'urgent' || urgency === 'overdue') && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-signal rounded-full" />
      )}

      {sub.status === 'active' && urgency === 'soon' && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-warn rounded-full" />
      )}
    </div>
  )
}
