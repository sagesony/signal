"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { RecentInsights } from "@/components/dashboard/recent-insights"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import type { DashboardStats } from "@/types"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  })()

  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "there"

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening in your competitive landscape.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : stats ? (
        <>
          <StatsGrid
            totalCompetitors={stats.totalCompetitors}
            totalAds={stats.totalAds}
            newInsights={stats.newInsights}
            savedAds={stats.savedAds}
          />

          <div className="grid lg:grid-cols-2 gap-4">
            <RecentInsights insights={stats.topInsights} />
            <ActivityFeed ads={stats.recentAds} />
          </div>

          {stats.totalCompetitors === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Add your first competitor</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
                Signal will start tracking their ads and generating insights automatically.
              </p>
              <a
                href="/competitors"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Go to Competitors
              </a>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
