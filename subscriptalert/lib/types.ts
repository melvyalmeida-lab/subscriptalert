// ─────────────────────────────────────────────
// SubscriptAlert — Core Types
// ─────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'trial'
export type ReminderTiming = 1 | 3 | 7 // days before renewal

export interface Subscription {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  billingCycle: BillingCycle
  nextRenewalDate: string // ISO date string
  category: SubscriptionCategory
  status: SubscriptionStatus
  logo?: string
  color?: string
  reminderDays: ReminderTiming[]
  emailReminder: boolean
  notes?: string
  detectedFrom?: 'gmail' | 'manual' // source
  gmailThreadId?: string
  createdAt: string
  updatedAt: string
}

export type SubscriptionCategory =
  | 'streaming'
  | 'software'
  | 'productivity'
  | 'fitness'
  | 'news'
  | 'gaming'
  | 'music'
  | 'storage'
  | 'finance'
  | 'shopping'
  | 'other'

export interface UserSettings {
  email: string
  name: string
  currency: string
  reminderEmail: string
  defaultReminderDays: ReminderTiming[]
  emailRemindersEnabled: boolean
  gmailConnected: boolean
  lastGmailScan?: string
}

export interface SpendSummary {
  monthlyTotal: number
  yearlyTotal: number
  byCategory: Record<SubscriptionCategory, number>
  activeCount: number
  upcomingRenewals: Subscription[] // next 7 days
}

export interface GmailDetectedSubscription {
  name: string
  amount: number
  currency: string
  billingCycle: BillingCycle
  nextRenewalDate: string
  detectedDate: string
  confidence: 'high' | 'medium' | 'low'
  rawEmailSubject: string
  gmailThreadId: string
}

// Category metadata for display
export const CATEGORY_META: Record<
  SubscriptionCategory,
  { label: string; icon: string; color: string }
> = {
  streaming: { label: 'Streaming', icon: '📺', color: '#E84B2F' },
  software: { label: 'Software', icon: '💻', color: '#3B82F6' },
  productivity: { label: 'Productivity', icon: '⚡', color: '#8B5CF6' },
  fitness: { label: 'Fitness', icon: '🏃', color: '#10B981' },
  news: { label: 'News & Media', icon: '📰', color: '#F59E0B' },
  gaming: { label: 'Gaming', icon: '🎮', color: '#EF4444' },
  music: { label: 'Music', icon: '🎵', color: '#EC4899' },
  storage: { label: 'Storage', icon: '☁️', color: '#6366F1' },
  finance: { label: 'Finance', icon: '💳', color: '#14B8A6' },
  shopping: { label: 'Shopping', icon: '🛍️', color: '#F97316' },
  other: { label: 'Other', icon: '📦', color: '#6B7280' },
}

// Common subscriptions for quick-add
export const KNOWN_SUBSCRIPTIONS: Partial<Subscription>[] = [
  { name: 'Netflix', category: 'streaming', color: '#E50914' },
  { name: 'Spotify', category: 'music', color: '#1DB954' },
  { name: 'Adobe Creative Cloud', category: 'software', color: '#FF0000' },
  { name: 'Apple iCloud', category: 'storage', color: '#555555' },
  { name: 'Google One', category: 'storage', color: '#4285F4' },
  { name: 'Amazon Prime', category: 'shopping', color: '#FF9900' },
  { name: 'Disney+', category: 'streaming', color: '#113CCF' },
  { name: 'YouTube Premium', category: 'streaming', color: '#FF0000' },
  { name: 'Notion', category: 'productivity', color: '#000000' },
  { name: 'Figma', category: 'software', color: '#F24E1E' },
  { name: 'GitHub', category: 'software', color: '#181717' },
  { name: 'Slack', category: 'productivity', color: '#4A154B' },
  { name: 'Zoom', category: 'productivity', color: '#2D8CFF' },
  { name: 'Dropbox', category: 'storage', color: '#0061FF' },
  { name: 'LinkedIn Premium', category: 'productivity', color: '#0A66C2' },
]
