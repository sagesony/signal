"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Building2, Bookmark, Zap, ChevronRight, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/ads",         label: "Creative Feed", icon: Layers },
  { href: "/competitors", label: "Brands",        icon: Building2 },
  { href: "/saved",       label: "Saved",         icon: Bookmark },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r border-border bg-card/40 px-3 py-4 shrink-0">
      {/* Logo */}
      <Link href="/ads" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center signal-glow shrink-0">
          <Zap className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Signal</span>
        <span className="ml-auto text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-1.5 py-0.5">
          Beta
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/ads" && (pathname.startsWith("/ads") || pathname === "/"))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group",
                active
                  ? "bg-indigo-600/12 text-indigo-400 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active
                    ? "text-indigo-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div>
        {(() => {
          const active = pathname === "/settings"
          return (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group",
                active
                  ? "bg-indigo-600/12 text-indigo-400 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Settings
                className={cn(
                  "w-4 h-4 shrink-0",
                  active
                    ? "text-indigo-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              Settings
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          )
        })()}
      </div>
    </aside>
  )
}
