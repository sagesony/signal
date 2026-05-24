"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Building2,
  Layers,
  Sparkles,
  Bookmark,
  Zap,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/competitors", label: "Competitors", icon: Building2 },
  { href: "/ads", label: "Ads Feed", icon: Layers },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/saved", label: "Saved", icon: Bookmark },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-border bg-card/40 px-3 py-4 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center signal-glow shrink-0">
          <Zap className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Signal</span>
        <span className="ml-auto text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-1.5 py-0.5">
          Beta
        </span>
      </Link>

      {/* Section label */}
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Intelligence
      </p>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
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
                  active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-indigo-400">
              {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {session?.user?.name ?? session?.user?.email?.split("@")[0]}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
