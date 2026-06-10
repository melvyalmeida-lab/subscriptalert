'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="font-display font-black text-2xl text-ink mb-2">Auth error</h1>
        <p className="text-ink-muted text-sm font-body mb-6">
          Something went wrong during sign in. Make sure your Google OAuth credentials are set up correctly.
        </p>
        <Link href="/auth/signin" className="btn-primary">Try again</Link>
      </div>
    </div>
  )
}
