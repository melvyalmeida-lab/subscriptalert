import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { google } from 'googleapis'
import type { GmailDetectedSubscription, BillingCycle } from '@/lib/types'

const SUBSCRIPTION_PATTERNS = [
  { pattern: /your .+ (subscription|membership|plan) (receipt|invoice|renewal|charge)/i, confidence: 'high' as const },
  { pattern: /receipt for your .+ (subscription|membership)/i, confidence: 'high' as const },
  { pattern: /billing (confirmation|receipt|invoice)/i, confidence: 'high' as const },
  { pattern: /payment (receipt|confirmation) from/i, confidence: 'high' as const },
  { pattern: /thank you for (subscribing|your subscription)/i, confidence: 'high' as const },
  { pattern: /your (annual|monthly|weekly) (subscription|renewal)/i, confidence: 'high' as const },
  { pattern: /renewal (confirmation|notice|reminder)/i, confidence: 'medium' as const },
  { pattern: /invoice #?\d+/i, confidence: 'medium' as const },
  { pattern: /(auto-renew|auto renew)/i, confidence: 'medium' as const },
]

const KNOWN_SENDERS: Record<string, { name: string; category: string }> = {
  'netflix.com': { name: 'Netflix', category: 'streaming' },
  'spotify.com': { name: 'Spotify', category: 'music' },
  'apple.com': { name: 'Apple', category: 'storage' },
  'google.com': { name: 'Google One', category: 'storage' },
  'adobe.com': { name: 'Adobe Creative Cloud', category: 'software' },
  'amazon.com': { name: 'Amazon Prime', category: 'shopping' },
  'dropbox.com': { name: 'Dropbox', category: 'storage' },
  'notion.so': { name: 'Notion', category: 'productivity' },
  'figma.com': { name: 'Figma', category: 'software' },
  'github.com': { name: 'GitHub', category: 'software' },
  'slack.com': { name: 'Slack', category: 'productivity' },
  'zoom.us': { name: 'Zoom', category: 'productivity' },
  'linkedin.com': { name: 'LinkedIn Premium', category: 'productivity' },
  'disney.com': { name: 'Disney+', category: 'streaming' },
  'hulu.com': { name: 'Hulu', category: 'streaming' },
  'youtube.com': { name: 'YouTube Premium', category: 'streaming' },
  'microsoft.com': { name: 'Microsoft 365', category: 'productivity' },
  'canva.com': { name: 'Canva', category: 'software' },
  'ahrefs.com': { name: 'Ahrefs', category: 'software' },
  'semrush.com': { name: 'SEMrush', category: 'software' },
  'mailchimp.com': { name: 'Mailchimp', category: 'productivity' },
}

const AMOUNT_PATTERNS = [
  /(?:charged|billed|amount|total|payment)[:\s]+[$₹€£]?\s*(\d+(?:[.,]\d{1,2})?)/i,
  /[$₹€£]\s*(\d+(?:[.,]\d{1,2})?)\s*(?:per|\/)\s*(?:month|year|week)/i,
  /(\d+(?:[.,]\d{1,2})?)\s*(?:USD|INR|EUR|GBP)/i,
  /total[:\s]+[$₹€£]?\s*(\d+(?:[.,]\d{1,2})?)/i,
]

function detectBillingCycle(text: string): BillingCycle {
  if (/annual|yearly|per year|\/year/i.test(text)) return 'yearly'
  if (/quarterly|per quarter|\/quarter/i.test(text)) return 'quarterly'
  if (/weekly|per week|\/week/i.test(text)) return 'weekly'
  return 'monthly'
}

function extractAmount(body: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = body.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      if (amount > 0 && amount < 10000) return amount
    }
  }
  return null
}

function decodeBody(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function extractTextFromParts(parts: any[]): string {
  let text = ''
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBody(part.body.data)
    } else if (part.parts) {
      text += extractTextFromParts(part.parts)
    }
  }
  return text
}

function confidenceScore(c: string): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const accessToken = (session as any).accessToken as string

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials({ access_token: accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const searchQuery = [
      'subject:(receipt OR invoice OR subscription OR billing OR renewal OR "thank you for your order")',
      'newer_than:365d',
    ].join(' ')

    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 100,
    })

    const messages = listResponse.data.messages || []
    const detected: GmailDetectedSubscription[] = []
    const processedThreads = new Set<string>()

    for (const msg of messages.slice(0, 50)) {
      if (!msg.id) continue
      if (msg.threadId && processedThreads.has(msg.threadId)) continue
      if (msg.threadId) processedThreads.add(msg.threadId)

      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })

        const headers = detail.data.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || ''
        const from = headers.find(h => h.name === 'From')?.value || ''
        const date = headers.find(h => h.name === 'Date')?.value || ''

        const matchedPattern = SUBSCRIPTION_PATTERNS.find(p => p.pattern.test(subject))
        if (!matchedPattern) continue

        let bodyText = ''
        if (detail.data.payload?.body?.data) {
          bodyText = decodeBody(detail.data.payload.body.data)
        } else if (detail.data.payload?.parts) {
          bodyText = extractTextFromParts(detail.data.payload.parts)
        }

        const fullText = `${subject} ${bodyText}`
        const emailMatch = from.match(/@([\w.-]+)/)
        const senderDomain = emailMatch?.[1] || ''
        const knownService = Object.entries(KNOWN_SENDERS).find(([domain]) =>
          senderDomain.includes(domain)
        )

        let serviceName = knownService?.[1].name
        if (!serviceName) {
          const nameMatch = subject.match(/(?:from|by|for)\s+([A-Z][a-zA-Z0-9\s.+]+?)(?:\s+[-–]|\s+subscription|\s+receipt|$)/i)
          serviceName = nameMatch?.[1]?.trim() || senderDomain.split('.')[0] || 'Unknown Service'
        }

        const amount = extractAmount(fullText)
        const billingCycle = detectBillingCycle(fullText)
        const emailDate = date ? new Date(date) : new Date()
        let nextRenewal = new Date(emailDate)

        if (billingCycle === 'monthly') nextRenewal.setMonth(nextRenewal.getMonth() + 1)
        else if (billingCycle === 'yearly') nextRenewal.setFullYear(nextRenewal.getFullYear() + 1)
        else if (billingCycle === 'quarterly') nextRenewal.setMonth(nextRenewal.getMonth() + 3)
        else nextRenewal.setDate(nextRenewal.getDate() + 7)

        while (nextRenewal < new Date()) {
          if (billingCycle === 'monthly') nextRenewal.setMonth(nextRenewal.getMonth() + 1)
          else if (billingCycle === 'yearly') nextRenewal.setFullYear(nextRenewal.getFullYear() + 1)
          else if (billingCycle === 'quarterly') nextRenewal.setMonth(nextRenewal.getMonth() + 3)
          else nextRenewal.setDate(nextRenewal.getDate() + 7)
        }

        detected.push({
          name: serviceName,
          amount: amount || 0,
          currency: 'USD',
          billingCycle,
          nextRenewalDate: nextRenewal.toISOString(),
          detectedDate: emailDate.toISOString(),
          confidence: amount ? matchedPattern.confidence : 'low',
          rawEmailSubject: subject,
          gmailThreadId: msg.threadId || msg.id || '',
        })
      } catch {
        continue
      }
    }

    const deduplicated = Object.values(
      detected.reduce((acc, item) => {
        const key = item.name.toLowerCase()
        if (!acc[key] || confidenceScore(item.confidence) > confidenceScore(acc[key].confidence)) {
          acc[key] = item
        }
        return acc
      }, {} as Record<string, GmailDetectedSubscription>)
    )

    return NextResponse.json({
      detected: deduplicated,
      scannedCount: messages.length,
      detectedCount: deduplicated.length,
    })
  } catch (error: any) {
    console.error('Gmail scan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scan Gmail' },
      { status: 500 }
    )
  }
}
