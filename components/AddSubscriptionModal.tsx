'use client'

import { useState } from 'react'
import { X, Search } from 'lucide-react'
import type { Subscription, BillingCycle, SubscriptionCategory, SubscriptionStatus } from '@/lib/types'
import { CATEGORY_META, KNOWN_SUBSCRIPTIONS } from '@/lib/types'
import { generateId, getNextRenewalDate, CYCLE_LABELS } from '@/lib/utils'

interface Props {
  onClose: () => void
  onAdd: (sub: Subscription) => void
}

const defaultForm = {
  name: '',
  amount: '',
  currency: 'USD',
  billingCycle: 'monthly' as BillingCycle,
  category: 'other' as SubscriptionCategory,
  nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'active' as SubscriptionStatus,
  emailReminder: true,
  reminderDays: [3] as (1 | 3 | 7)[],
  notes: '',
}

export default function AddSubscriptionModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState('')
  const [step, setStep] = useState<'search' | 'form'>('search')

  const filtered = KNOWN_SUBSCRIPTIONS.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  )

  function selectKnown(known: typeof KNOWN_SUBSCRIPTIONS[0]) {
    setForm(f => ({
      ...f,
      name: known.name || '',
      category: (known.category as SubscriptionCategory) || 'other',
    }))
    setStep('form')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    const sub: Subscription = {
      id: generateId(),
      name: form.name,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      billingCycle: form.billingCycle,
      category: form.category,
      nextRenewalDate: new Date(form.nextRenewalDate).toISOString(),
      status: form.status,
      emailReminder: form.emailReminder,
      reminderDays: form.reminderDays,
      notes: form.notes,
      detectedFrom: 'manual',
      createdAt: now,
      updatedAt: now,
    }
    onAdd(sub)
    onClose()
  }

  function toggleReminderDay(day: 1 | 3 | 7) {
    setForm(f => ({
      ...f,
      reminderDays: f.reminderDays.includes(day)
        ? f.reminderDays.filter(d => d !== day)
        : [...f.reminderDays, day],
    }))
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-paper-warm">
          <h2 className="font-display font-bold text-xl text-ink tracking-tight">
            {step === 'search' ? 'Add Subscription' : form.name || 'Add Subscription'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-paper-warm rounded-lg transition-colors">
            <X size={16} className="text-ink-muted" />
          </button>
        </div>

        {/* Step 1: Quick search */}
        {step === 'search' && (
          <div className="p-6">
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search Netflix, Spotify, Notion…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9"
                autoFocus
              />
            </div>

            {/* Quick picks */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(search ? filtered : KNOWN_SUBSCRIPTIONS).slice(0, 9).map(known => (
                <button
                  key={known.name}
                  onClick={() => selectKnown(known)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-paper-warm
                  transition-all border border-paper-warm text-center"
                >
                  <span className="text-xl">{CATEGORY_META[known.category as SubscriptionCategory]?.icon || '📦'}</span>
                  <span className="text-xs font-body text-ink truncate w-full">{known.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full text-center text-sm text-ink-muted hover:text-ink font-body py-2 transition-colors"
            >
              Enter manually →
            </button>
          </div>
        )}

        {/* Step 2: Full form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

            <div>
              <label className="label">Service name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Netflix"
                className="input"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">
                    {form.currency === 'USD' ? '$' : form.currency === 'INR' ? '₹' : '€'}
                  </span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="input pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="input"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Billing cycle</label>
                <select
                  value={form.billingCycle}
                  onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value as BillingCycle }))}
                  className="input"
                >
                  {(Object.entries(CYCLE_LABELS) as [BillingCycle, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as SubscriptionCategory }))}
                  className="input"
                >
                  {(Object.entries(CATEGORY_META) as [SubscriptionCategory, any][]).map(([val, meta]) => (
                    <option key={val} value={val}>{meta.icon} {meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Next renewal date *</label>
              <input
                type="date"
                required
                value={form.nextRenewalDate}
                onChange={e => setForm(f => ({ ...f, nextRenewalDate: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as SubscriptionStatus }))}
                className="input"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Reminder settings */}
            <div>
              <label className="label">Remind me before renewal</label>
              <div className="flex gap-2">
                {([1, 3, 7] as const).map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleReminderDay(day)}
                    className={`flex-1 py-2 rounded-lg text-sm font-display font-medium transition-all
                      ${form.reminderDays.includes(day)
                        ? 'bg-ink text-paper'
                        : 'bg-paper-warm text-ink-muted hover:text-ink'
                      }`}
                  >
                    {day} day{day > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-display font-medium text-ink">Email reminders</div>
                <div className="text-xs text-ink-muted font-body">Get an email before renewal</div>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, emailReminder: !f.emailReminder }))}
                className={`w-10 h-6 rounded-full transition-all relative ${form.emailReminder ? 'bg-ink' : 'bg-paper-muted'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.emailReminder ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Shared with partner, cancel after project"
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('search')} className="btn-ghost flex-1">
                ← Back
              </button>
              <button type="submit" className="btn-primary flex-1">
                Add Subscription
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
