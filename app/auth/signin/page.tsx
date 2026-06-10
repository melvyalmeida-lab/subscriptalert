'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Mail, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
              <span className="text-paper text-xs font-display font-bold">SA</span>
            </div>
            <span className="font-display font-bold text-ink text-xl tracking-tight">SubscriptAlert</span>
          </Link>
          <h1 className="font-display font-black text-3xl text-ink tracking-tight mb-2">
            Sign in
          </h1>
          <p className="text-ink-muted text-sm font-body">
            Connect Gmail to auto-detect your subscriptions
          </p>
        </div>

        {/* Sign in card */}
        <div className="card p-8 animate-fade-up stagger-1">

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-ink text-paper
            font-display font-semibold text-sm px-5 py-3.5 rounded-xl
            transition-all duration-200 hover:bg-ink-muted active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-paper-muted"></div>
            <span className="text-xs text-ink-muted font-body">What we access</span>
            <div className="flex-1 h-px bg-paper-muted"></div>
          </div>

          {/* Permissions info */}
          <div className="space-y-3">
            {[
              { icon: <Mail size={14} />, text: 'Read Gmail to detect billing emails' },
              { icon: <Shield size={14} />, text: 'Read-only access — we never send email' },
              { icon: <ArrowRight size={14} />, text: 'Your email data is never stored on our servers' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-xs text-ink-muted font-body">
                <span className="text-safe flex-shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Skip option */}
        <p className="text-center mt-6 text-sm text-ink-muted animate-fade-up stagger-2">
          Prefer not to connect Gmail?{' '}
          <Link href="/dashboard" className="text-ink font-semibold hover:text-signal transition-colors">
            Use manually →
          </Link>
        </p>

      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
