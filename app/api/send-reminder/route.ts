import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { format, differenceInDays } from 'date-fns'
import type { Subscription } from '@/lib/types'
import { formatCurrency, getMonthlyAmount } from '@/lib/utils'

// Lazy init so build doesn't fail without env vars
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

// This route can be called:
// 1. Manually (user clicks "Test Reminder")
// 2. Via a Vercel Cron Job (daily check)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptions, userEmail, userName } = body as {
      subscriptions: Subscription[]
      userEmail: string
      userName: string
    }

    if (!subscriptions?.length || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find subscriptions due in the next 7 days
    const now = new Date()
    const upcoming = subscriptions.filter(s => {
      if (s.status !== 'active' && s.status !== 'trial') return false
      if (!s.emailReminder) return false
      const days = differenceInDays(new Date(s.nextRenewalDate), now)
      return s.reminderDays.includes(days as any)
    })

    if (!upcoming.length) {
      return NextResponse.json({ message: 'No reminders due today', sent: 0 })
    }

    // Build the email HTML
    const emailHtml = buildReminderEmail(upcoming, userName)

    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'reminders@subscriptalert.com',
      to: userEmail,
      subject: `⏰ ${upcoming.length} subscription${upcoming.length > 1 ? 's' : ''} renewing soon`,
      html: emailHtml,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reminders sent', sent: upcoming.length, id: data?.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Vercel Cron endpoint - runs daily at 8am
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // In a real app, you'd fetch all users from a DB here
  // For now, this is a placeholder
  return NextResponse.json({ message: 'Cron job ran', timestamp: new Date().toISOString() })
}

function buildReminderEmail(subscriptions: Subscription[], userName: string): string {
  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0)

  const rows = subscriptions.map(s => {
    const days = differenceInDays(new Date(s.nextRenewalDate), new Date())
    const urgencyColor = days <= 1 ? '#E84B2F' : days <= 3 ? '#C47C1A' : '#2E7D5E'
    const daysLabel = days === 0 ? 'TODAY' : days === 1 ? 'Tomorrow' : `In ${days} days`

    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #EDE9E1;">
          <div style="font-weight: 600; color: #0D0D0D; font-size: 15px;">${s.name}</div>
          <div style="color: #6B7280; font-size: 13px; margin-top: 2px;">${s.billingCycle} subscription</div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #EDE9E1; text-align: right;">
          <div style="font-weight: 700; color: #0D0D0D;">${formatCurrency(s.amount, s.currency)}</div>
          <div style="color: ${urgencyColor}; font-size: 12px; font-weight: 600; margin-top: 2px;">${daysLabel}</div>
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 520px; margin: 0 auto; padding: 40px 16px;">

        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <div style="font-size: 22px; font-weight: 800; color: #0D0D0D; letter-spacing: -0.5px;">
            SubscriptAlert
          </div>
          <div style="width: 32px; height: 3px; background: #E84B2F; margin-top: 4px;"></div>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0D0D0D; margin: 0 0 8px 0; letter-spacing: -0.5px;">
            Heads up, ${userName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style="color: #6B7280; margin: 0; font-size: 15px; line-height: 1.5;">
            You have ${subscriptions.length} subscription${subscriptions.length > 1 ? 's' : ''} renewing soon.
            Here's what's coming up:
          </p>
        </div>

        <!-- Subscriptions Table -->
        <div style="background: white; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <table style="width: 100%; border-collapse: collapse;">
            ${rows}
          </table>
          <div style="padding: 16px; background: #F7F4EF; display: flex; justify-content: space-between;">
            <span style="font-size: 13px; color: #6B7280;">Total upcoming charges</span>
            <span style="font-weight: 700; color: #E84B2F;">${formatCurrency(total)}</span>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display: inline-block; background: #0D0D0D; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.2px;">
            View Dashboard →
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">SubscriptAlert · No more surprise charges</p>
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9CA3AF;">Manage reminders</a>
            &nbsp;·&nbsp;
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9CA3AF;">Unsubscribe</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}
