import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'SubscriptAlert — No more surprise charges',
  description: "Track all your subscriptions in one place. Get reminded before you're charged.",
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'SubscriptAlert',
    description: 'Track subscriptions. Kill surprise charges.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper font-body text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
