'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Mail, Bell, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import type { Subscription } from '@/lib/types'
import { loadSubscriptions, saveSubscriptions, formatCurrency, getMonthlyAmount } from '@/lib/utils'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [reminderEmail, setReminderEmail] = useState('')
  const [testStatus, setTestStatus] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    setSubs(loadSubscriptions())
    setReminderEmail(session?.user?.email || '')
  }, [session])

  async function sendTestReminder() {
    if (!reminderEmail) return
    setIsSending(true)
    setTestStatus('')

    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptions: subs,
          userEmail: reminderEmail,
          userName: session?.user?.name || 'there',
        }),
      })
      const data = await res.json()
      setTestStatus(data.message || 'Email sent!')
    } catch (err) {
      setTestStatus('Failed to send. Check your Resend API key.')
    } finally {
      setIsSending(false)
    }
  }

  function exportData() {
    const json = JSON.stringify(subs, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscriptalert-export.json'
    a.click()
  }

  function clearAllData() {
    if (confirm('Delete all subscription data? This cannot be undone.')) {
      saveSubscriptions([])
      setSubs([])
    }
  }

  const totalMonthly = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle), 0)

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-body mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <h1 className="font-display font-black text-3xl text-ink tracking-tight mb-8">Settings</h1>

        {/* Stats */}
        <div className="card p-6 mb-6 animate-fade-up">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-muted mb-4">Your data</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display font-black text-2xl text-ink">{subs.length}</div>
              <div className="text-xs text-ink-muted font-body">Subscriptions</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl text-ink">{formatCurrency(totalMonthly)}</div>
              <div className="text-xs text-ink-muted font-body">Monthly spend</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl text-ink">
                {subs.filter(s => s.detectedFrom === 'gmail').length}
              </div>
              <div className="text-xs text-ink-muted font-body">From Gmail</div>
            </div>
          </div>
        </div>

        {/* Email reminders */}
        <div className="card p-6 mb-6 animate-fade-up stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-ink" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-muted">Email Reminders</h2>
          </div>

          <div className="mb-4">
            <label className="label">Send reminders to</label>
            <input
              type="email"
              value={reminderEmail}
              onChange={e => setReminderEmail(e.target.value)}
              placeholder="your@email.com"
              className="input"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={sendTestReminder}
              disabled={isSending || !reminderEmail}
              className="btn-ghost flex items-center gap-2"
            >
              <Mail size={14} />
              {isSending ? 'Sending…' : 'Send test reminder'}
            </button>
            {testStatus && (
              <span className="text-sm font-body text-safe">{testStatus}</span>
            )}
          </div>

          <p className="text-xs text-ink-muted font-body mt-3">
            Reminders are sent via Resend. Configure your API key in <code className="font-mono text-xs bg-paper-warm px-1 py-0.5 rounded">.env.local</code>
          </p>
        </div>

        {/* Account */}
        {session && (
          <div className="card p-6 mb-6 animate-fade-up stagger-2">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-ink" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-muted">Account</h2>
            </div>
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img src={session.user.image} className="w-10 h-10 rounded-full" alt="" />
              )}
              <div>
                <div className="font-display font-bold text-sm text-ink">{session.user?.name}</div>
                <div className="text-xs text-ink-muted font-body">{session.user?.email}</div>
                <div className="text-xs text-safe font-body mt-0.5">
                  {session.gmailConnected ? '✓ Gmail connected' : '○ Gmail not connected'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data management */}
        <div className="card p-6 animate-fade-up stagger-3">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink-muted mb-4">Data</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-display font-medium text-ink">Export subscriptions</div>
                <div className="text-xs text-ink-muted font-body">Download your data as JSON</div>
              </div>
              <button onClick={exportData} className="btn-ghost flex items-center gap-2 text-xs">
                <Download size={12} /> Export
              </button>
            </div>
            <div className="border-t border-paper-warm pt-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-display font-medium text-signal">Clear all data</div>
                <div className="text-xs text-ink-muted font-body">Permanently delete everything</div>
              </div>
              <button onClick={clearAllData} className="btn-danger flex items-center gap-2 text-xs py-2 px-3">
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted font-body mt-8">
          All data is stored in your browser's localStorage — nothing leaves your device.
        </p>

      </div>
    </div>
  )
}
