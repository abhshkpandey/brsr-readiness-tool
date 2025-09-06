"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LayoutDashboard, ClipboardList, FileText, Menu, X, Leaf } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Assessment",
    href: "/assessment",
    icon: ClipboardList,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
]

export function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-background/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:translate-x-0 shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-sm transition-transform hover:scale-105">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">BRSR Tool</h1>
              <p className="text-xs text-muted-foreground font-medium">Assessment Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm hover:translate-x-1",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "scale-110" : "group-hover:scale-105",
                    )}
                  />
                  <span className="font-semibold">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-sidebar-primary-foreground rounded-full opacity-60" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-sidebar-border">
            <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-sm">ESG Compliance</p>
                <p className="leading-relaxed">
                  Track your sustainability metrics and reporting readiness with confidence.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
