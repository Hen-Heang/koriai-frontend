import type { Metadata } from "next"

import { AppProviders } from "@/components/providers/app-providers"

import "./globals.css"

export const metadata: Metadata = {
  title: "KoriAI Frontend",
  description: "Korean AI learning platform frontend built with Next.js.",
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
