import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SidebarNav } from "@/components/sidebar-nav"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "BRSR Assessment Tool",
  description: "Business Responsibility and Sustainability Reporting Assessment Platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="flex h-screen bg-background">
            <SidebarNav />
            <main className="flex-1 md:ml-64 overflow-auto">{children}</main>
          </div>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
