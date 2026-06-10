import Link from 'next/link'
import { ArrowRight, Bell, CreditCard, Mail, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper grain">

      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
            <span className="text-paper text-xs font-display font-bold">SA</span>
          </div>
          <span className="font-display font-bold text-ink text-lg tracking-tight">SubscriptAlert</span>
        </div>
        <Link href="/dashboard" className="btn-primary text-sm">
          Open Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-28">
        <div className="animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-signal-pale text-signal text-xs font-mono font-medium px-3 py-1.5 rounded-full mb-8 border border-signal/20">
            <span className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse-soft"></span>
            No more surprise charges
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-ink text-5xl md:text-7xl leading-[0.95] tracking-tight mb-8 max-w-3xl">
            Know every
            <span className="relative ml-3">
              <span className="relative z-10">subscription</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-signal/20 -z-0 -skew-x-1"></span>
            </span>
            <br />you pay for.
          </h1>

          <p className="text-ink-muted text-xl font-body leading-relaxed max-w-lg mb-10">
            Connect Gmail, see every subscription detected automatically.
            Get reminded 3 days before you're charged. Cancel what you forgot.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              Start tracking free
              <ArrowRight size={16} />
            </Link>
            <span className="text-ink-muted text-sm font-body">No credit card needed.</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-20 pt-16 border-t border-paper-muted animate-fade-up stagger-3">
          {[
            { number: '₹4,200', label: 'avg. monthly spend on subscriptions per person' },
            { number: '43%', label: 'of subscriptions are forgotten or unused' },
            { number: '3 days', label: 'early warning before any renewal charge' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-display font-black text-4xl text-ink mb-2">{stat.number}</div>
              <div className="text-ink-muted text-sm font-body leading-relaxed">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink text-paper py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display font-black text-4xl mb-16 tracking-tight">
            Built for one thing.<br />
            <span className="text-signal">Do it perfectly.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail size={20} />,
                title: 'Gmail Scan',
                desc: 'Connect once. We scan your inbox for billing emails and auto-detect subscriptions — name, amount, billing cycle.',
              },
              {
                icon: <Bell size={20} />,
                title: 'Smart Reminders',
                desc: 'Email you 1, 3, or 7 days before a charge hits. Dashboard highlights urgent renewals in red.',
              },
              {
                icon: <CreditCard size={20} />,
                title: 'Spend Clarity',
                desc: 'See your real monthly and yearly subscription spend. Broken down by category.',
              },
              {
                icon: <Zap size={20} />,
                title: 'Manual Add',
                desc: 'Didn\'t come through email? Add any subscription manually in under 10 seconds.',
              },
              {
                icon: <Shield size={20} />,
                title: 'Privacy First',
                desc: 'Gmail access is read-only. We never store your emails. All subscription data lives in your browser.',
              },
              {
                icon: <ArrowRight size={20} />,
                title: '100% Free',
                desc: 'No paywalls. No upselling a credit score. Just subscriptions, tracked.',
              },
            ].map((f, i) => (
              <div key={f.title} className={`animate-fade-up stagger-${i + 1}`}>
                <div className="w-10 h-10 bg-paper/10 rounded-lg flex items-center justify-center mb-4 text-signal">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-paper/60 text-sm font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display font-black text-5xl text-ink mb-6 tracking-tight">
          Ready to stop the leaks?
        </h2>
        <p className="text-ink-muted mb-10 text-lg">Takes 60 seconds to set up.</p>
        <Link href="/dashboard" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
          Open Dashboard <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-paper-muted py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="font-display font-bold text-ink text-sm">SubscriptAlert</span>
          <span className="text-ink-muted text-xs font-body">Built with ♥ — your data stays in your browser</span>
        </div>
      </footer>

    </main>
  )
}
