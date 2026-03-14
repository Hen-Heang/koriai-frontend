import type { Metadata, Viewport } from "next"

import { AppProviders } from "@/components/providers/app-providers"

import "./globals.css"

// Tells the browser to shrink the visual viewport (and dvh units) when the
// virtual keyboard opens — keeps the chat input visible on mobile.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  title: "KoriAI — Korean AI Tutor",
  description: "Practice Korean with your personal AI tutor. Chat, corrections, vocabulary, and more.",
  icons: {
    icon: "/favicon.svg",
    apple: "/koriai-logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
