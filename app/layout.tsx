import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'A/B Script Platform',
  description: 'Create, edit and publish JavaScript snippets for A/B testing',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}