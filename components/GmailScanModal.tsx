'use client'

import { useState } from 'react'
import { X, Mail, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { signIn } from 'next-auth/react'
import type { GmailDetectedSubscription, Subscription, BillingCycle, SubscriptionCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import { generateId, formatCurrency } from '@/lib/utils'

interface Props {
  onClose: () => void
  onImport: (subscriptions: Subscription[]) => void
  session: any
}

type ScanState = 'idle' | 'scanning' | 'results' | 'error'

export default function GmailScanModal({ onClose, onImport, session }: Props) {
  const [state, setState] = useState<ScanState>('idle')
  const [detected, setDetected] = useState<GmailDetectedSubscription[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [scannedCount, setScannedCount] = useState(0)

  async function startScan() {
    if (!session?.accessToken) {
      await signIn('google', { callbackUrl: '/dashboard' })
      return
    }

    setState('scanning')
    try {
      const res = await fetch('/api/gmail-scan', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Scan failed')

      setDetected(data.detected || [])
      setScannedCount(data.scannedCount || 0)
      setSelected(new Set(data.detected?.map((_: any, i: number) => i) || []))
      setState('results')
    } catch (err: any) {
      setError(err.message)
      setState('error')
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function handleImport() {
    const now = new Date().toISOString()
    const toImport: Subscription[] = detected
      .filter((_, i) => selected.has(i))
      .map(d => ({
        id: generateId(),
        name: d.name,
        amount: d.amount,
        currency: d.currency,
        billingCycle: d.billingCycle,
        category: 'other' as SubscriptionCategory,
        nextRenewalDate: d.nextRenewalDate,
        status: 'active' as const,
        emailReminder: true,
        reminderDays: [3] as (1 | 3 | 7)[],
        detectedFrom: 'gmail' as const,
        gmailThreadId: d.gmailThreadId,
        createdAt: now,
        updatedAt: now,
      }))

    onImport(toImport)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-up max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-paper-warm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-paper-warm rounded-lg flex items-center justify-center">
              <Mail size={14} className="text-ink" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink tracking-tight">Scan Gmail</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-paper-warm rounded-lg transition-colors">
            <X size={16} className="text-ink-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Idle: not logged in or ready to scan */}
          {state === 'idle' && (
            <div className="p-6 text-center">
              {!session ? (
                <>
                  <div className="text-5xl mb-4">🔗</div>
                  <h3 className="font-display font-bold text-xl text-ink mb-2">Connect Gmail first</h3>
                  <p className="text-ink-muted text-sm font-body mb-6">
                    Sign in with Google to let us scan your inbox for billing emails.
                    Read-only access — we never store your emails.
                  </p>
                  <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="btn-primary">
                    Connect Gmail
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">📬</div>
                  <h3 className="font-display font-bold text-xl text-ink mb-2">Ready to scan</h3>
                  <p className="text-ink-muted text-sm font-body mb-6 max-w-sm mx-auto">
                    We'll scan the last 12 months of emails for subscription receipts and billing confirmations.
                    This takes about 10–20 seconds.
                  </p>
                  <div className="bg-paper-warm rounded-xl p-4 text-left mb-6 space-y-2">
                    {[
                      '✓ Read-only Gmail access',
                      '✓ Emails are never stored on our servers',
                      '✓ You choose which ones to import',
                    ].map(t => (
                      <div key={t} className="text-xs font-body text-ink-muted">{t}</div>
                    ))}
                  </div>
                  <button onClick={startScan} className="btn-primary w-full">
                    Start Scanning
                  </button>
                </>
              )}
            </div>
          )}

          {/* Scanning */}
          {state === 'scanning' && (
            <div className="p-8 text-center">
              <Loader2 size={40} className="animate-spin text-ink mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl text-ink mb-2">Scanning your inbox…</h3>
              <p className="text-ink-muted text-sm font-body">
                Looking through billing emails, receipts, and renewal notices.
              </p>
            </div>
          )}

          {/* Results */}
          {state === 'results' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display font-bold text-ink">
                    {detected.length} subscription{detected.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-xs text-ink-muted font-body">from {scannedCount} emails scanned</p>
                </div>
                <button
                  onClick={() => setSelected(selected.size === detected.length ? new Set() : new Set(detected.map((_, i) => i)))}
                  className="text-xs text-ink-muted hover:text-ink font-body transition-colors"
                >
                  {selected.size === detected.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {detected.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-ink font-display font-bold mb-1">No subscriptions detected</p>
                  <p className="text-ink-muted text-sm font-body">
                    Try adding them manually, or your billing emails might use unusual formats.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {detected.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => toggleSelect(i)}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border
                        ${selected.has(i)
                          ? 'border-ink bg-paper-warm'
                          : 'border-paper-warm bg-white hover:border-paper-muted'
                        }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${selected.has(i) ? 'bg-ink border-ink' : 'border-paper-muted'}`}>
                        {selected.has(i) && <CheckCircle size={12} className="text-white" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-sm text-ink">{item.name}</div>
                        <div className="text-xs text-ink-muted font-body truncate mt-0.5">
                          {item.rawEmailSubject}
                        </div>
                      </div>

                      {/* Amount + confidence */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-display font-bold text-sm text-ink">
                          {item.amount > 0 ? formatCurrency(item.amount, item.currency) : 'Unknown'}
                        </div>
                        <div className={`text-xs font-mono mt-0.5 ${
                          item.confidence === 'high' ? 'text-safe'
                          : item.confidence === 'medium' ? 'text-warn'
                          : 'text-ink-muted'
                        }`}>
                          {item.confidence} confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="p-8 text-center">
              <AlertCircle size={40} className="text-signal mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl text-ink mb-2">Scan failed</h3>
              <p className="text-signal text-sm font-mono mb-4">{error}</p>
              <button onClick={() => setState('idle')} className="btn-ghost">Try again</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {state === 'results' && detected.length > 0 && (
          <div className="p-6 border-t border-paper-warm flex-shrink-0">
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Import {selected.size} subscription{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
