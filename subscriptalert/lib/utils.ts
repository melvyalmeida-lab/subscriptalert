import { format, differenceInDays, addMonths, addYears, addWeeks, addQuarters, isPast, isWithinInterval, addDays } from 'date-fns'
import type { Subscription, BillingCycle, SpendSummary, SubscriptionCategory } from './types'

// ─── Date Utilities ─────────────────────────────────────────

export function getNextRenewalDate(date: string, cycle: BillingCycle): string {
  const d = new Date(date)
  const now = new Date()
  let next = d

  // Keep advancing until it's in the future
  while (next <= now) {
    switch (cycle) {
      case 'weekly':    next = addWeeks(next, 1); break
      case 'monthly':   next = addMonths(next, 1); break
      case 'quarterly': next = addQuarters(next, 1); break
      case 'yearly':    next = addYears(next, 1); break
    }
  }

  return next.toISOString()
}

export function getDaysUntilRenewal(renewalDate: string): number {
  return differenceInDays(new Date(renewalDate), new Date())
}

export function formatRenewalDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function getRenewalUrgency(daysUntil: number): 'overdue' | 'urgent' | 'soon' | 'ok' {
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 1) return 'urgent'
  if (daysUntil <= 7) return 'soon'
  return 'ok'
}

// ─── Cost Utilities ──────────────────────────────────────────

export function getMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':    return amount * 4.33
    case 'monthly':   return amount
    case 'quarterly': return amount / 3
    case 'yearly':    return amount / 12
  }
}

export function getYearlyAmount(amount: number, cycle: BillingCycle): number {
  return getMonthlyAmount(amount, cycle) * 12
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Spend Summary ────────────────────────────────────────────

export function computeSpendSummary(subscriptions: Subscription[]): SpendSummary {
  const active = subscriptions.filter(s => s.status === 'active' || s.status === 'trial')

  const monthlyTotal = active.reduce((sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle), 0)
  const yearlyTotal = monthlyTotal * 12

  const byCategory = active.reduce((acc, s) => {
    const monthly = getMonthlyAmount(s.amount, s.billingCycle)
    acc[s.category] = (acc[s.category] || 0) + monthly
    return acc
  }, {} as Record<SubscriptionCategory, number>)

  const now = new Date()
  const in7Days = addDays(now, 7)
  const upcomingRenewals = active
    .filter(s => isWithinInterval(new Date(s.nextRenewalDate), { start: now, end: in7Days }))
    .sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime())

  return {
    monthlyTotal,
    yearlyTotal,
    byCategory,
    activeCount: active.length,
    upcomingRenewals,
  }
}

// ─── ID Generation ────────────────────────────────────────────

export function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ─── Local Storage (client-side persistence) ──────────────────

const STORAGE_KEY = 'subscriptalert_subscriptions'
const SETTINGS_KEY = 'subscriptalert_settings'

export function loadSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSubscriptions(subscriptions: Subscription[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
}

export function addSubscription(sub: Subscription): Subscription[] {
  const existing = loadSubscriptions()
  const updated = [...existing, sub]
  saveSubscriptions(updated)
  return updated
}

export function updateSubscription(id: string, updates: Partial<Subscription>): Subscription[] {
  const existing = loadSubscriptions()
  const updated = existing.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
  saveSubscriptions(updated)
  return updated
}

export function deleteSubscription(id: string): Subscription[] {
  const existing = loadSubscriptions()
  const updated = existing.filter(s => s.id !== id)
  saveSubscriptions(updated)
  return updated
}

// ─── Billing Cycle Labels ─────────────────────────────────────

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}
