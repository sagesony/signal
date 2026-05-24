"use client"

import { Building2, Layers, Sparkles, Bookmark, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: number | string
  delta?: string
  icon: React.ElementType
  accent: string
}

interface StatsGridProps {
  totalCompetitors: number
  totalAds: number
  newInsights: number
  savedAds: number
}

export function StatsGrid({ totalCompetitors, totalAds, newInsights, savedAds }: StatsGridProps) {
  const stats: Stat[] = [
    {
      label: "Competitors",
      value: totalCompetitors,
      icon: Building2,
      accent: "text-indigo-400 bg-indigo-500/10",
    },
    {
      label: "Ads Tracked",
      value: totalAds,
      delta: "+12 this week",
      icon: Layers,
      accent: "text-violet-400 bg-violet-500/10",
    },
    {
      label: "New Insights",
      value: newInsights,
      delta: "Last 7 days",
      icon: Sparkles,
      accent: "text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Saved Ads",
      value: savedAds,
      icon: Bookmark,
      accent: "text-amber-400 bg-amber-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 card-hover"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.accent)}>
              <stat.icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
          {stat.delta && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              {stat.delta}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
