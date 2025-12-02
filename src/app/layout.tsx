import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AE Item Selector',
  description: 'Select items for Another Eden mass purchase script',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

