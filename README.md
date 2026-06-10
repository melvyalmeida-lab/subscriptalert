# SubscriptAlert

**No more surprise charges.** Track every subscription you pay for. Get reminded before you're charged. Cancel what you forgot.

---

## What it does

- **Gmail scan** — Connect once, auto-detect billing emails from the last 12 months
- **Manual add** — Quick-add any subscription in under 10 seconds
- **Dashboard** — See monthly/yearly spend, renewals by category
- **Smart reminders** — Email you 1, 3, or 7 days before a charge hits
- **Privacy first** — Data lives in your browser (localStorage). Gmail is read-only. Nothing stored on servers.

---

## Tech stack

- **Next.js 14** (App Router)
- **NextAuth v5** (Google OAuth + Gmail scope)
- **Resend** (email reminders)
- **Tailwind CSS** (custom design system)
- **Vercel** (hosting + cron jobs)

---

## Setup (15 minutes)

### 1. Clone & install

```bash
git clone <your-repo>
cd subscriptalert
npm install
```

### 2. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
4. Create credentials: APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - For production add: `https://yourdomain.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret

### 3. Set up Resend (email reminders)

1. Sign up at [resend.com](https://resend.com) — free tier is 3,000 emails/month
2. Create an API key
3. Add your domain (or use `onboarding@resend.dev` for testing)

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from step 2>
GOOGLE_CLIENT_SECRET=<from step 2>
RESEND_API_KEY=<from step 3>
RESEND_FROM_EMAIL=reminders@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=<run: openssl rand -base64 16>
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Then in Vercel dashboard → Your project → Settings → Environment Variables, add all the variables from `.env.local`.

Update in Vercel:
- `NEXTAUTH_URL` → `https://your-app.vercel.app`
- `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app`

Also add the production redirect URI in Google Cloud Console:
`https://your-app.vercel.app/api/auth/callback/google`

The `vercel.json` already has the daily cron job configured (runs at 8am UTC).

---

## Project structure

```
subscriptalert/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── settings/page.tsx     # Settings + email test
│   ├── auth/
│   │   ├── signin/page.tsx   # Sign in page
│   │   └── error/page.tsx    # Auth error page
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth handler
│       ├── gmail-scan/route.ts          # Gmail scanning
│       └── send-reminder/route.ts      # Resend email + cron
├── components/
│   ├── AddSubscriptionModal.tsx
│   ├── GmailScanModal.tsx
│   ├── SubscriptionCard.tsx
│   ├── SpendSummaryBar.tsx
│   ├── UpcomingRenewals.tsx
│   └── Providers.tsx
├── lib/
│   ├── types.ts              # All TypeScript types
│   └── utils.ts              # Date, currency, localStorage utils
├── auth.ts                   # NextAuth config
├── vercel.json               # Vercel + cron config
└── .env.example              # Template for env vars
```

---

## Customisation

**Add more known senders** — edit `KNOWN_SENDERS` in `app/api/gmail-scan/route.ts`

**Change reminder timing** — edit the `reminderDays` options in `components/AddSubscriptionModal.tsx`

**Add a database** — replace the localStorage calls in `lib/utils.ts` with your DB of choice (PlanetScale, Supabase, etc.)

**Custom domain for email** — verify your domain in Resend and update `RESEND_FROM_EMAIL`

---

Built with ♥ — your data stays in your browser.
