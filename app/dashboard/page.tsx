'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, RefreshCw, Bell, Settings, LogOut, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { Subscription } from '@/lib/types'
import { loadSubscriptions, saveSubscriptions, computeSpendSummary, formatCurrency, getDaysUntilRenewal, getRenewalUrgency, formatRenewalDate, CYCLE_LABELS } from '@/lib/utils'
import { CATEGORY_META } from '@/lib/types'
import AddSubscriptionModal from '@/components/AddSubscriptionModal'
import GmailScanModal from '@/components/GmailScanModal'
import SubscriptionCard from '@/components/SubscriptionCard'
import SpendSummaryBar from '@/components/SpendSummaryBar'
import UpcomingRenewals from '@/components/UpcomingRenewals'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGmailModal, setShowGmailModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load subscriptions from localStorage on mount
  useEffect(() => {
    const subs = loadSubscriptions()
    setSubscriptions(subs)
    setIsLoaded(true)
  }, [])

  const summary = computeSpendSummary(subscriptions)

  // Filtered subscriptions
  const filtered = subscriptions.filter(s => {
    const categoryMatch = filterCategory === 'all' || s.category === filterCategory
    const statusMatch = filterStatus === 'all' || s.status === filterStatus
    return categoryMatch && statusMatch
  })

  const sorted = [...filtered].sort((a, b) => {
    const daysA = getDaysUntilRenewal(a.nextRenewalDate)
    const daysB = getDaysUntilRenewal(b.nextRenewalDate)
    return daysA - daysB
  })

  function handleSubscriptionAdded(sub: Subscription) {
    const updated = [...subscriptions, sub]
    setSubscriptions(updated)
    saveSubscriptions(updated)
  }

  function handleSubscriptionUpdated(updated: Subscription[]) {
    setSubscriptions(updated)
  }

  function handleGmailImport(detected: Subscription[]) {
    const existing = loadSubscriptions()
    // Merge, avoiding duplicates by name
    const existingNames = existing.map(s => s.name.toLowerCase())
    const newOnes = detected.filter(d => !existingNames.includes(d.name.toLowerCase()))
    const merged = [...existing, ...newOnes]
    setSubscriptions(merged)
    saveSubscriptions(merged)
  }

  const categories = ['all', ...Object.keys(CATEGORY_META)] as const

  return (
    <div className="min-h-screen bg-paper">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-ink text-paper flex flex-col py-6 px-4 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-7 h-7 bg-signal rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-display font-bold">SA</span>
          </div>
          <span className="font-display font-bold text-paper tracking-tight">SubscriptAlert</span>
        </div>

        {/* Actions */}
        <div className="space-y-1 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-2.5 text-sm font-display font-medium
            text-paper/80 hover:text-paper hover:bg-paper/10 rounded-lg px-3 py-2.5 transition-all"
          >
            <Plus size={15} />
            Add Subscription
          </button>

          <button
            onClick={() => setShowGmailModal(true)}
            className="w-full flex items-center gap-2.5 text-sm font-display font-medium
            text-paper/80 hover:text-paper hover:bg-paper/10 rounded-lg px-3 py-2.5 transition-all"
          >
            <RefreshCw size={15} />
            Scan Gmail
          </button>
        </div>

        {/* Filter by category */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-display font-semibold text-paper/30 uppercase tracking-widest px-3 mb-2">
            Category
          </p>
          <div className="space-y-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all text-left
                  ${filterCategory === cat
                    ? 'bg-paper/15 text-paper font-display font-semibold'
                    : 'text-paper/50 hover:text-paper/80 hover:bg-paper/8 font-body'
                  }`}
              >
                {cat === 'all' ? (
                  <>
                    <span className="text-base">🗂</span>
                    <span>All</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">{CATEGORY_META[cat as keyof typeof CATEGORY_META].icon}</span>
                    <span>{CATEGORY_META[cat as keyof typeof CATEGORY_META].label}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-paper/10 pt-4 space-y-1">
          {session ? (
            <>
              <div className="px-3 py-2 mb-1">
                <p className="text-xs text-paper/40 font-body truncate">{session.user?.email}</p>
              </div>
              <Link href="/settings"
                className="w-full flex items-center gap-2.5 text-sm font-body text-paper/60
                hover:text-paper hover:bg-paper/10 rounded-lg px-3 py-2 transition-all">
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-2.5 text-sm font-body text-paper/60
                hover:text-paper hover:bg-paper/10 rounded-lg px-3 py-2 transition-all">
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/signin"
              className="w-full flex items-center gap-2 text-sm font-body text-signal
              hover:bg-paper/10 rounded-lg px-3 py-2 transition-all">
              Connect Gmail →
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-black text-3xl text-ink tracking-tight">
              {session ? `Hey, ${session.user?.name?.split(' ')[0]} 👋` : 'Your Subscriptions'}
            </h1>
            <p className="text-ink-muted text-sm font-body mt-1">
              {subscriptions.length === 0
                ? 'Add subscriptions manually or scan Gmail to get started'
                : `${subscriptions.filter(s => s.status === 'active').length} active · ${summary.upcomingRenewals.length} renewing this week`
              }
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={14} />
            Add Subscription
          </button>
        </div>

        {/* Spend summary */}
        {subscriptions.length > 0 && (
          <SpendSummaryBar summary={summary} />
        )}

        {/* Upcoming renewals alert */}
        {summary.upcomingRenewals.length > 0 && (
          <UpcomingRenewals renewals={summary.upcomingRenewals} />
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-paper-warm rounded-xl p-1 w-fit">
          {(['active', 'all', 'cancelled', 'paused']).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-display font-medium transition-all capitalize
                ${filterStatus === status
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-ink-muted hover:text-ink'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {isLoaded && subscriptions.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-display font-bold text-2xl text-ink mb-2">No subscriptions yet</h3>
            <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
              Connect Gmail to auto-detect your billing emails, or add subscriptions manually.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowGmailModal(true)} className="btn-primary flex items-center gap-2">
                <RefreshCw size={14} /> Scan Gmail
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn-ghost flex items-center gap-2">
                <Plus size={14} /> Add manually
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions grid */}
        {sorted.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((sub, i) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
                onUpdate={handleSubscriptionUpdated}
              />
            ))}
          </div>
        )}

        {/* Filtered empty state */}
        {isLoaded && subscriptions.length > 0 && sorted.length === 0 && (
          <div className="text-center py-16 text-ink-muted">
            <p className="font-body">No subscriptions match this filter.</p>
          </div>
        )}

      </main>

      {/* Modals */}
      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleSubscriptionAdded}
        />
      )}

      {showGmailModal && (
        <GmailScanModal
          onClose={() => setShowGmailModal(false)}
          onImport={handleGmailImport}
          session={session}
        />
      )}

    </div>
  )
}
