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
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
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
